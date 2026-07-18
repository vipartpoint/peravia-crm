import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject, forwardRef, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ReceivablesService } from '../receivables/receivables.service';
import { ApprovalRulesEngine } from '../approvals/approval-rules.engine';
import { ApprovalsService } from '../approvals/approvals.service';
import { InventoryService } from '../inventory/inventory.service';
import { ActivitiesService } from '../activities/activities.service';
import { NotificationsCenterService } from '../notifications-center/notifications-center.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private receivablesService: ReceivablesService,
    private approvalRulesEngine: ApprovalRulesEngine,
    @Inject(forwardRef(() => ApprovalsService))
    private approvalsService: ApprovalsService,
    private inventoryService: InventoryService,
    private activitiesService: ActivitiesService,
    private notificationsCenter: NotificationsCenterService
  ) {}

  private generateOrderNumber(): string {
    const date = new Date();
    const yy = String(date.getFullYear()).slice(2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${yy}${mm}${dd}-${Date.now().toString().slice(-4)}-${random}`;
  }

  async create(createOrderDto: CreateOrderDto, user: any) {
    const { items, ...orderData } = createOrderDto;

    // Check Customer status
    const customer = await this.prisma.customer.findUnique({ where: { id: orderData.customerId } });
    if (!customer) {
      throw new BadRequestException('Customer not found.');
    }

    const receivables = await this.receivablesService.getCustomerRiskAndCredit(customer.id);
    if (!receivables) {
      throw new BadRequestException('Unable to calculate customer financials.');
    }

    // Blocked customer check is now handled by the ApprovalRulesEngine

    // Process items and calculate totals
    let totalAmount = 0;
    let netAmount = 0;
    let totalEstimatedProfit = 0;
    let hasHighDiscount = false;

    const processedItems = await Promise.all(items.map(async (item) => {
      const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
      if (!product || !product.isActive) {
        throw new BadRequestException(`Product ${item.productId} is inactive or not found.`);
      }

      const discountPercent = item.discountPercent || 0;
      if (discountPercent > 5) hasHighDiscount = true;

      const discountAmount = (item.unitPrice * discountPercent) / 100;
      const finalUnitPrice = item.unitPrice - discountAmount;
      const totalPrice = finalUnitPrice * item.quantity;
      const estimatedCost = Number(product.estimatedCost);
      const estimatedProfit = (finalUnitPrice - estimatedCost) * item.quantity;

      totalAmount += (item.unitPrice * item.quantity);
      netAmount += totalPrice;
      totalEstimatedProfit += estimatedProfit;

      return {
        productId: product.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent,
        finalUnitPrice,
        totalPrice,
        estimatedCost,
        estimatedProfit
      };
    }));

    const discountAmount = totalAmount - netAmount;

    let status = orderData.status || 'Draft';

    const highestDiscount = items.reduce((max, item) => Math.max(max, Number(item.discountPercent || 0)), 0);
    const orderTotalForCredit = netAmount;
    const creditExceeded = orderTotalForCredit > receivables.remainingCredit;
    const riskStatus = receivables.riskStatus;
    const hasRecentBouncedCheque = receivables.bouncedChequeAmount > 0;

    const ruleResult = this.approvalRulesEngine.evaluateOrder(orderTotalForCredit, highestDiscount, creditExceeded, riskStatus, hasRecentBouncedCheque);

    if (ruleResult.needsApproval && status !== 'Draft') {
      status = 'PendingApproval';
    }

    const orderNumber = this.generateOrderNumber();

    const firstWarehouse = await this.prisma.warehouse.findFirst({ where: { code: 'WH-MAIN' } });
    const warehouseId = orderData.warehouseId || firstWarehouse?.id;
    if (!warehouseId) throw new BadRequestException('No warehouse assigned to order.');

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        customerId: orderData.customerId,
        userId: user.id,
        territoryId: orderData.territoryId || customer.territoryId,
        warehouseId: warehouseId,
        brand: orderData.brand,
        status,
        totalAmount,
        discountAmount,
        netAmount,
        estimatedProfit: totalEstimatedProfit,
        uncollectedAmount: netAmount, // default
        createdBy: user.id,
        items: {
          create: processedItems
        }
      },
      include: { items: true }
    });

    // Reserve Stock
    const reservationResult = await this.inventoryService.reserveStockForOrder(order.id, processedItems, user.id, warehouseId);
    if (!reservationResult.success && reservationResult.reason === 'Shortage') {
       await this.prisma.order.delete({ where: { id: order.id } });
       throw new BadRequestException('Inventory Shortage: Shortage request created. Order creation blocked until stock is available.');
    }

    await this.logAudit(user.id, 'CREATE_ORDER', 'Order', order.id, null, order);
    
    await this.activitiesService.logActivity({
      entityType: 'Order',
      entityId: order.id,
      activityType: 'Created',
      title: 'ثبت سفارش جدید',
      description: `سفارش فروش با شماره ${order.orderNumber} ثبت شد.`
    }, user.id);

    // Notify user of order creation
    await this.notificationsCenter.createNotification({
      userId: user.id,
      title: 'سفارش ثبت شد',
      message: `سفارش جدید شما با شماره ${order.orderNumber} ثبت شد.`,
      type: 'OrderCreated',
      priority: 'Low',
      entityType: 'Order',
      entityId: order.id,
      actionUrl: `/orders/dashboard`
    });
    
    if (ruleResult.needsApproval && status === 'PendingApproval') {
      await this.approvalsService.createWorkflowRequest({
        requestType: ruleResult.requestType,
        entityType: 'Order',
        entityId: order.id,
        requestedBy: user.id,
        requiredRoles: ruleResult.requiredRoles,
        requiredLevels: ruleResult.requiredRoles.length,
        reason: ruleResult.reason
      }, user);
      await this.logAudit(user.id, 'SUBMIT_ORDER_FOR_APPROVAL', 'Order', order.id, null, { status, rules: ruleResult.requiredRoles });
    }

    return order;
  }

  async findAll(user: any) {
    let whereClause: any = { deletedAt: null };

    if (user.role.name === 'SalesRep') {
      whereClause.userId = user.id;
    } else if (user.role.name === 'RegionalManager') {
      // Find orders in territories they manage
      const managed = await this.prisma.territory.findMany({ where: { managerId: user.id } });
      const managedIds = managed.map(t => t.id);
      
      const allTerritories = await this.prisma.territory.findMany();
      const visibleTerritories = new Set<string>(managedIds);
      const addChildren = (parentId: string) => {
        for (const t of allTerritories) {
          if (t.parentId === parentId && !visibleTerritories.has(t.id)) {
            visibleTerritories.add(t.id);
            addChildren(t.id);
          }
        }
      };
      for (const id of managedIds) addChildren(id);
      
      whereClause.territoryId = { in: Array.from(visibleTerritories) };
    }
    // CEO, SystemAdmin, SalesManager, Finance see all (no where restriction besides deletedAt)

    return this.prisma.order.findMany({
      where: whereClause,
      include: {
        customer: { select: { name: true, phone: true } },
        user: { select: { username: true } },
        _count: { select: { items: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string, user: any) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        user: { select: { id: true, username: true } },
        items: { include: { product: true } }
      }
    });

    if (!order || order.deletedAt) throw new NotFoundException(`Order ${id} not found`);

    if (user.role.name === 'SalesRep' && order.userId !== user.id) {
      throw new ForbiddenException('Access denied');
    }
    // Note: Can add RegionalManager strict checking here as well

    return order;
  }

  async updateStatus(id: string, status: string, user: any, notes?: string) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw new NotFoundException('Order not found');

    const receivables = await this.receivablesService.getCustomerRiskAndCredit(order.customerId);
    const highestDiscount = order.items.reduce((max, item) => Math.max(max, Number(item.discountPercent || 0)), 0);
    const orderTotalForCredit = Number(order.netAmount);
    const creditExceeded = orderTotalForCredit > (receivables?.remainingCredit ?? 0);
    const riskStatus = receivables?.riskStatus ?? 'Normal';
    const hasRecentBouncedCheque = receivables?.bouncedChequeAmount && receivables.bouncedChequeAmount > 0 ? true : false;

    const ruleResult = this.approvalRulesEngine.evaluateOrder(orderTotalForCredit, highestDiscount, creditExceeded, riskStatus, hasRecentBouncedCheque);

    if (status === 'Approved' && ruleResult.needsApproval) {
      // Must use workflow
      throw new ForbiddenException('This order requires formal approval through the workflow engine. Please submit for approval.');
    }

    if (status === 'PendingApproval' && ruleResult.needsApproval) {
      const existing = await this.prisma.approvalRequest.findFirst({ where: { entityId: id, status: 'Pending' } });
      if (!existing) {
        await this.approvalsService.createWorkflowRequest({
          requestType: ruleResult.requestType,
          entityType: 'Order',
          entityId: order.id,
          requestedBy: user.id,
          requiredRoles: ruleResult.requiredRoles,
          requiredLevels: ruleResult.requiredRoles.length,
          reason: ruleResult.reason
        }, user);
      }
    }

    // Role checks
    if (['Approved', 'Delivered', 'Returned', 'Completed'].includes(status)) {
      if (user.role.name === 'SalesRep') {
        throw new ForbiddenException(`Sales Rep cannot change status to ${status}`);
      }
    }

    let approvedBy = order.approvedBy;
    if (status === 'Approved' && !approvedBy) approvedBy = user.id;

    let deliveredAt = order.deliveredAt;
    if (status === 'Delivered' && !deliveredAt) deliveredAt = new Date();

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status,
        approvedBy,
        deliveredAt
      }
    });

    await this.logAudit(user.id, 'UPDATE_ORDER_STATUS', 'Order', id, order.status, status);
    
    if (status === 'Approved') {
      await this.activitiesService.logActivity({
        entityType: 'Order',
        entityId: id,
        activityType: 'OrderApproved',
        title: 'تأیید سفارش',
        description: `سفارش فروش با موفقیت تأیید شد.`
      }, user.id);

      await this.notificationsCenter.createNotification({
        userId: order.userId,
        title: 'سفارش تأیید شد',
        message: `سفارش ${order.orderNumber} تأیید شد.`,
        type: 'OrderApproved',
        priority: 'Low',
        entityType: 'Order',
        entityId: id,
        actionUrl: `/orders/dashboard`
      });
    } else {
      await this.activitiesService.logActivity({
        entityType: 'Order',
        entityId: id,
        activityType: 'StatusChanged',
        title: 'تغییر وضعیت سفارش',
        description: `وضعیت سفارش به ${status} تغییر یافت.`,
        metadata: { status }
      }, user.id);

      if (status === 'Cancelled') {
        await this.notificationsCenter.createNotification({
          userId: order.userId,
          title: 'سفارش لغو شد',
          message: `سفارش ${order.orderNumber} لغو گردید.`,
          type: 'Alert',
          priority: 'Medium',
          entityType: 'Order',
          entityId: id,
          actionUrl: `/orders/dashboard`
        });
      }
    }

    return updatedOrder;
  }

  async applyApprovalDecision(id: string, decision: 'Approved' | 'Rejected', user: any, requestType?: string) {
    if (decision === 'Rejected') {
      const updated = await this.prisma.order.update({
        where: { id },
        data: { status: 'Rejected' }
      });
      await this.logAudit(user.id, 'ORDER_REJECTED_BY_WORKFLOW', 'Order', id, 'PendingApproval', 'Rejected');
      return updated;
    }

    // Revalidate order before final approval
    const order = await this.findOne(id, user);
    const receivables = await this.receivablesService.getCustomerRiskAndCredit(order.customerId);
    
    // Only block if they became blocked AFTER the request, or if the request wasn't specifically for a Blocked customer.
    if (receivables && receivables.riskStatus === 'Blocked' && requestType !== 'BlockedCustomerOrder' && requestType !== 'MultipleExceptions') {
      throw new ForbiddenException('Cannot approve order: Customer is now blocked.');
    }
    // Note: Can check inventory availability here if needed

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: 'Approved', approvedBy: user.id }
    });
    await this.logAudit(user.id, 'ORDER_APPROVED_BY_WORKFLOW', 'Order', id, 'PendingApproval', 'Approved');
    
    await this.activitiesService.logActivity({
      entityType: 'Order',
      entityId: id,
      activityType: 'OrderApproved',
      title: 'تأیید سفارش',
      description: `سفارش فروش با موفقیت تأیید شد.`
    }, user.id);
    
    return updated;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto, user: any) {
    const order = await this.findOne(id, user);

    if (user.role.name === 'Finance') {
      // Finance can only update payment Status
      if (updateOrderDto.paymentStatus !== undefined || updateOrderDto.collectedAmount !== undefined) {
        const collected = updateOrderDto.collectedAmount !== undefined ? updateOrderDto.collectedAmount : Number(order.collectedAmount);
        const paymentStatus = updateOrderDto.paymentStatus || order.paymentStatus;
        const netAmount = Number(order.netAmount);
        const uncollectedAmount = netAmount - collected;

        const updated = await this.prisma.order.update({
          where: { id },
          data: { paymentStatus, collectedAmount: collected, uncollectedAmount }
        });
        await this.logAudit(user.id, 'UPDATE_ORDER_PAYMENT', 'Order', id, order, updated);
        return updated;
      }
      throw new ForbiddenException('Finance can only update payment status.');
    }

    if (order.status !== 'Draft' && updateOrderDto.status === undefined) {
      throw new BadRequestException('Cannot edit order details unless it is in Draft status.');
    }

    // Logic for changing status
    if (updateOrderDto.status && updateOrderDto.status !== order.status) {
      if (updateOrderDto.status === 'Approved' && !['CEO', 'SalesManager', 'SystemAdmin'].includes(user.role.name)) {
        throw new ForbiddenException('You cannot approve orders.');
      }
      
      const newStatus = updateOrderDto.status;
      
      const updated = await this.prisma.$transaction(async (tx) => {
        const orderItems = await tx.orderItem.findMany({ where: { orderId: id } });
        const warehouseId = order.warehouseId;
        if (!warehouseId) throw new BadRequestException('Order has no warehouse assigned.');

        if (newStatus === 'Cancelled') {
          // Will be handled outside transaction via InventoryService
        }

        return tx.order.update({
          where: { id },
          data: { 
            status: newStatus,
            ...(newStatus === 'Approved' ? { approvedBy: user.id } : {}),
            ...(newStatus === 'Delivered' ? { deliveredAt: new Date() } : {})
          }
        });
      });

      if (newStatus === 'Cancelled') {
         if (['Shipped', 'Delivered'].includes(order.dispatchStatus)) {
            // Do not automatically restore inventory. Formal return required.
         } else {
            await this.inventoryService.releaseReservation(id, user.id);
            // Revert real stock if it was paid
            if (order.paymentStatus === 'Paid') {
              // Create offsetting StockMovement for cancelled paid orders
              for (const item of order.items) {
                await this.prisma.inventoryStock.updateMany({
                  where: { warehouseId: order.warehouseId!, productId: item.productId },
                  data: {
                    quantityOnHand: { increment: item.quantity },
                    availableQuantity: { increment: item.quantity }
                  }
                });
                await this.prisma.stockMovement.create({
                  data: { warehouseId: order.warehouseId!, productId: item.productId, movementType: 'Return', quantity: item.quantity, relatedType: 'OrderReturn', relatedId: id, createdBy: user.id }
                });
              }
            }
         }
      }

      await this.logAudit(user.id, 'CHANGE_ORDER_STATUS', 'Order', id, { status: order.status }, { status: updated.status });
      
      if (updated.status === 'PendingApproval') {
        await this.logAudit(user.id, 'SUBMIT_ORDER_FOR_APPROVAL', 'Order', id, null, { status: updated.status });
      } else if (updated.status === 'Approved') {
        await this.logAudit(user.id, 'APPROVE_ORDER', 'Order', id, null, { status: updated.status });
        await this.activitiesService.logActivity({
          entityType: 'Order',
          entityId: id,
          activityType: 'OrderApproved',
          title: 'تأیید سفارش',
          description: `سفارش فروش به صورت دستی تأیید شد.`
        }, user.id);
      } else if (updated.status === 'Cancelled') {
        await this.logAudit(user.id, 'CANCEL_ORDER', 'Order', id, null, { status: updated.status });
        await this.activitiesService.logActivity({
          entityType: 'Order',
          entityId: id,
          activityType: 'OrderCancelled',
          title: 'لغو سفارش',
          description: `سفارش فروش لغو گردید.`
        }, user.id);
      }

      return updated;
    }

    // Standard draft edit logic
    // Removing old items and inserting new ones for simplicity
    const { items, ...orderData } = updateOrderDto;
    
    // Process items similarly to create if provided
    let dataToUpdate: any = { ...orderData };
    
    if (items) {
      let totalAmount = 0;
      let netAmount = 0;
      let totalEstimatedProfit = 0;

      const processedItems = await Promise.all(items.map(async (item) => {
        const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new BadRequestException(`Product ${item.productId} not found.`);

        const discountPercent = item.discountPercent || 0;
        const discountAmount = (item.unitPrice * discountPercent) / 100;
        const finalUnitPrice = item.unitPrice - discountAmount;
        const totalPrice = finalUnitPrice * item.quantity;
        const estimatedCost = Number(product.estimatedCost);
        const estimatedProfit = (finalUnitPrice - estimatedCost) * item.quantity;

        totalAmount += (item.unitPrice * item.quantity);
        netAmount += totalPrice;
        totalEstimatedProfit += estimatedProfit;

        return {
          productId: product.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent,
          finalUnitPrice,
          totalPrice,
          estimatedCost,
          estimatedProfit
        };
      }));

      const discountAmount = totalAmount - netAmount;

      await this.prisma.orderItem.deleteMany({ where: { orderId: id } });
      
      dataToUpdate.totalAmount = totalAmount;
      dataToUpdate.netAmount = netAmount;
      dataToUpdate.discountAmount = discountAmount;
      dataToUpdate.estimatedProfit = totalEstimatedProfit;
      dataToUpdate.uncollectedAmount = netAmount - Number(order.collectedAmount);
      
      const updated = await this.prisma.order.update({
        where: { id },
        data: {
          ...dataToUpdate,
          items: {
            create: processedItems
          }
        },
        include: { items: true }
      });
      await this.logAudit(user.id, 'UPDATE_ORDER', 'Order', id, order, updated);
      return updated;
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: dataToUpdate
    });
    await this.logAudit(user.id, 'UPDATE_ORDER', 'Order', id, order, updated);
    return updated;
  }

  async remove(id: string, user: any, reason?: string) {
    const order = await this.findOne(id, user);

    if (order.status === 'Approved' || order.status === 'Delivered') {
      throw new BadRequestException('Cannot archive Approved or Delivered orders.');
    }

    const archived = await this.prisma.order.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: user.id,
        deleteReason: reason || 'No reason provided'
      }
    });

    await this.logAudit(user.id, 'ARCHIVE_ORDER', 'Order', id, order, archived);
    return archived;
  }

  private async logAudit(userId: string, action: string, entityType: string, entityId: string, oldValue: any, newValue: any) {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
        newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
      }
    });
  }
}
