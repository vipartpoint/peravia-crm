import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DispatchService {
  constructor(private prisma: PrismaService) {}

  private readonly workflowStages = [
    'NotStarted',
    'WarehousePrep',
    'OutboundQC',
    'Shipped',
    'Delivered'
  ];

  async getDispatchOrders(user: any) {
    // Only show orders that are Approved (meaning Proforma is approved and payment is potentially in progress)
    // Dispatch Note is created after payment, so only show Paid orders or Orders explicitly marked for dispatch.
    // The prompt says "After payment: Dispatch Note Created". So paymentStatus must be Paid.
    
    return this.prisma.order.findMany({
      where: {
        paymentStatus: 'Paid',
        dispatchStatus: { not: 'Delivered' }
      },
      include: {
        customer: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async advanceDispatch(orderId: string, user: any, notes?: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new NotFoundException('Order not found');
      if (order.paymentStatus !== 'Paid') throw new BadRequestException('Order must be Paid before dispatch starts');

      const currentIndex = this.workflowStages.indexOf(order.dispatchStatus);
      if (currentIndex === -1 || currentIndex >= this.workflowStages.length - 1) {
        throw new BadRequestException('Order cannot be advanced further');
      }

      const nextStatus = this.workflowStages[currentIndex + 1];

      // Role checks (basic)
      if (nextStatus === 'OutboundQC' && !['SystemAdmin', 'WarehouseManager', 'WarehouseOperator'].includes(user.role.name)) {
         throw new ForbiddenException('Only Warehouse roles can complete Prep');
      }
      if (nextStatus === 'Shipped' && !['SystemAdmin', 'QC'].includes(user.role.name)) {
         throw new ForbiddenException('Only QC can approve Outbound QC');
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data: { dispatchStatus: nextStatus }
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'DISPATCH_ADVANCED',
          entityType: 'Order',
          entityId: orderId,
          oldValue: { dispatchStatus: order.dispatchStatus },
          newValue: { dispatchStatus: nextStatus, notes }
        }
      });

      return updated;
    });
  }

  async rejectDispatch(orderId: string, user: any, notes: string) {
    if (!notes) throw new BadRequestException('Notes/Comments are required for rejection');

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new NotFoundException('Order not found');

      const currentIndex = this.workflowStages.indexOf(order.dispatchStatus);
      if (currentIndex <= 1) { // Can't go back further than WarehousePrep
        throw new BadRequestException('Cannot reject at this stage');
      }

      const prevStatus = this.workflowStages[currentIndex - 1];

      const updated = await tx.order.update({
        where: { id: orderId },
        data: { dispatchStatus: prevStatus }
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'DISPATCH_REJECTED',
          entityType: 'Order',
          entityId: orderId,
          oldValue: { dispatchStatus: order.dispatchStatus },
          newValue: { dispatchStatus: prevStatus, notes }
        }
      });

      return updated;
    });
  }
}
