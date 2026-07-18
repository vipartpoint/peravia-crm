import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsCenterService } from '../notifications-center/notifications-center.service';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsCenter: NotificationsCenterService
  ) {}

  async getStocks(filters: { warehouseId?: string; productId?: string }) {
    return this.prisma.inventoryStock.findMany({
      where: filters,
      include: { warehouse: true, product: true }
    });
  }

  async getAlerts() {
    const stocks = await this.prisma.inventoryStock.findMany({
      include: { warehouse: true, product: true }
    });
    return stocks.filter(s => Number(s.availableQuantity) < Number(s.minStockLevel));
  }

  async getMovements(filters: { warehouseId?: string; productId?: string }) {
    return this.prisma.stockMovement.findMany({
      where: filters,
      include: { warehouse: true, product: true, creator: { select: { username: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200
    });
  }

  async adjustStock(data: { warehouseId: string; productId: string; newQuantity: number; notes?: string }, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      let stock = await tx.inventoryStock.findUnique({
        where: { warehouseId_productId: { warehouseId: data.warehouseId, productId: data.productId } }
      });

      if (!stock) {
        stock = await tx.inventoryStock.create({
          data: {
            warehouseId: data.warehouseId,
            productId: data.productId,
            quantityOnHand: 0,
            availableQuantity: 0,
            reservedQuantity: 0,
            minStockLevel: 0
          }
        });
      }

      const oldQuantity = Number(stock.quantityOnHand);
      const diff = data.newQuantity - oldQuantity;

      if (diff === 0) return stock;

      const newAvailable = Number(stock.availableQuantity) + diff;
      if (newAvailable < 0) throw new BadRequestException('Cannot adjust stock to result in negative available quantity');

      const updatedStock = await tx.inventoryStock.update({
        where: { id: stock.id },
        data: {
          quantityOnHand: data.newQuantity,
          availableQuantity: newAvailable
        }
      });

      await tx.stockMovement.create({
        data: {
          warehouseId: data.warehouseId,
          productId: data.productId,
          movementType: 'ManualAdjustment',
          quantity: diff,
          relatedType: 'Manual',
          notes: data.notes || `Adjusted from ${oldQuantity} to ${data.newQuantity}`,
          createdBy: userId
        }
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'STOCK_ADJUSTMENT',
          entityType: 'InventoryStock',
          entityId: updatedStock.id,
          oldValue: stock as any,
          newValue: updatedStock as any,
        }
      });

      return updatedStock;
    });
  }

  async reserveStockForOrder(orderId: string, items: any[], userId: string, warehouseId: string) {
    return this.prisma.$transaction(async (tx) => {
      const shortages = [];
      for (const item of items) {
        const stock = await tx.inventoryStock.findUnique({
          where: { warehouseId_productId: { warehouseId, productId: item.productId } }
        });
        const available = stock ? Number(stock.availableQuantity) : 0;
        if (available < item.quantity) {
          shortages.push({ productId: item.productId, requested: item.quantity, available });
        }
      }

      if (shortages.length > 0) {
        const managers = await this.prisma.user.findMany({ where: { role: { name: 'WarehouseManager' } } });
        for (const s of shortages) {
          const req = await tx.inventoryShortageRequest.create({
            data: {
              orderId,
              productId: s.productId,
              requestedQuantity: s.requested,
              availableQuantity: s.available,
              status: 'PendingWarehouseManager'
            }
          });

          await tx.approvalRequest.create({
            data: {
              requestType: 'InventoryShortage',
              entityType: 'InventoryShortage',
              entityId: req.id,
              requestedBy: userId,
              title: `کسری موجودی برای محصول ${s.productId}`,
              priority: 'High',
              reason: `موجودی ناکافی برای سفارش ${orderId}`,
            }
          });

          for (const manager of managers) {
            await this.notificationsCenter.createNotification({
              userId: manager.id,
              title: 'کسری موجودی انبار',
              message: `سفارش ${orderId} دارای کسری در تامین کالاست. درخواست بررسی شد.`,
              type: 'System',
              priority: 'Medium',
              entityType: 'InventoryShortageRequest',
              entityId: req.id,
              actionUrl: `/inventory/alerts`
            });
          }
        }
        return { success: false, reason: 'Shortage', shortages };
      }

      for (const item of items) {
        await tx.inventoryStock.updateMany({
          where: { warehouseId, productId: item.productId },
          data: {
            reservedQuantity: { increment: item.quantity },
            availableQuantity: { decrement: item.quantity }
          }
        });

        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

        const res = await tx.inventoryReservation.create({
          data: { orderId, productId: item.productId, warehouseId, quantity: item.quantity, expiresAt, status: 'Active' }
        });

        await tx.stockMovement.create({
          data: {
            warehouseId, productId: item.productId, movementType: 'Reservation',
            quantity: item.quantity, relatedType: 'Order', relatedId: orderId, createdBy: userId
          }
        });

        await tx.auditLog.create({
          data: { userId, action: 'INVENTORY_RESERVED', entityType: 'InventoryReservation', entityId: res.id, newValue: { quantity: item.quantity } }
        });
      }

      return { success: true };
    });
  }

  async deductRealStockAfterPayment(orderId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const reservations = await tx.inventoryReservation.findMany({
        where: { orderId, status: 'Active' }
      });

      for (const res of reservations) {
        // Release reservation
        await tx.inventoryReservation.update({
          where: { id: res.id },
          data: { status: 'Released' }
        });

        // Deduct from real stock and reserved stock
        await tx.inventoryStock.updateMany({
          where: { warehouseId: res.warehouseId, productId: res.productId },
          data: {
            reservedQuantity: { decrement: res.quantity },
            quantityOnHand: { decrement: res.quantity }
          }
        });

        await tx.stockMovement.create({
          data: {
            warehouseId: res.warehouseId, productId: res.productId, movementType: 'Sale',
            quantity: res.quantity, relatedType: 'Order', relatedId: orderId, createdBy: userId
          }
        });

        await tx.auditLog.create({
          data: { userId, action: 'INVENTORY_SALE_DEDUCTION', entityType: 'InventoryReservation', entityId: res.id, newValue: { quantity: res.quantity } }
        });
      }
      return { success: true };
    });
  }

  async releaseReservation(orderId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const reservations = await tx.inventoryReservation.findMany({
        where: { orderId, status: 'Active' }
      });

      for (const res of reservations) {
        await tx.inventoryReservation.update({
          where: { id: res.id },
          data: { status: 'Released' }
        });

        await tx.inventoryStock.updateMany({
          where: { warehouseId: res.warehouseId, productId: res.productId },
          data: {
            reservedQuantity: { decrement: res.quantity },
            availableQuantity: { increment: res.quantity }
          }
        });

        await tx.stockMovement.create({
          data: {
            warehouseId: res.warehouseId, productId: res.productId, movementType: 'ReservationReleased',
            quantity: res.quantity, relatedType: 'Order', relatedId: orderId, createdBy: userId
          }
        });

        await tx.auditLog.create({
          data: { userId, action: 'RESERVATION_RELEASED', entityType: 'InventoryReservation', entityId: res.id }
        });
      }
    });
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleExpiredReservations() {
    this.logger.log('Checking for expired reservations...');
    const expired = await this.prisma.inventoryReservation.findMany({
      where: { status: 'Active', expiresAt: { lt: new Date() } }
    });

    if (expired.length === 0) return;

    const systemUser = await this.prisma.user.findFirst({
      where: { role: { name: 'Admin' } }
    }) || await this.prisma.user.findFirst();

    if (!systemUser) {
      this.logger.error('No user found to perform system cron actions.');
      return;
    }

    for (const res of expired) {
      await this.prisma.$transaction(async (tx) => {
        await tx.inventoryReservation.update({
          where: { id: res.id },
          data: { status: 'Expired' }
        });

        await tx.inventoryStock.updateMany({
          where: { warehouseId: res.warehouseId, productId: res.productId },
          data: {
            reservedQuantity: { decrement: res.quantity },
            availableQuantity: { increment: res.quantity }
          }
        });

        await tx.stockMovement.create({
          data: {
            warehouseId: res.warehouseId, productId: res.productId, movementType: 'ReservationReleased',
            quantity: res.quantity, relatedType: 'OrderExpired', relatedId: res.orderId, createdBy: systemUser.id
          }
        });

        await tx.auditLog.create({
          data: { userId: null, action: 'RESERVATION_EXPIRED', entityType: 'InventoryReservation', entityId: res.id }
        });
      });

      // Send Notification to order owner
      const order = await this.prisma.order.findUnique({ where: { id: res.orderId } });
      if (order && order.userId) {
        await this.notificationsCenter.createNotification({
          userId: order.userId,
          title: 'انقضای رزرو انبار',
          message: `رزرو موجودی برای سفارش ${order.orderNumber} منقضی شد.`,
          type: 'System',
          priority: 'Medium',
          entityType: 'Order',
          entityId: order.id,
          actionUrl: `/orders/dashboard`
        });
      }
    }
  }

  async processReturn(warehouseId: string, productId: string, quantity: number, condition: 'Sellable' | 'Waste', orderId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      let stock = await tx.inventoryStock.findUnique({
        where: { warehouseId_productId: { warehouseId, productId } }
      });
      if (!stock) throw new BadRequestException('Stock record not found for this product in warehouse.');

      if (condition === 'Sellable') {
        await tx.inventoryStock.update({
          where: { id: stock.id },
          data: {
            quantityOnHand: { increment: quantity },
            availableQuantity: { increment: quantity }
          }
        });

        await tx.stockMovement.create({
          data: {
            warehouseId, productId, movementType: 'Return', quantity, relatedType: 'OrderReturn', relatedId: orderId, createdBy: userId
          }
        });
      } else {
        // Move to Waste (create a waste stock movement, does not increment available quantity)
        await tx.stockMovement.create({
          data: {
            warehouseId, productId, movementType: 'Waste', quantity, relatedType: 'OrderReturn', relatedId: orderId, createdBy: userId
          }
        });
      }
      return { success: true };
    });
  }

  async transferStockTx(tx: any, sourceWarehouseId: string, destWarehouseId: string, productId: string, quantity: number, relatedId: string, userId: string) {
    const sourceStock = await tx.inventoryStock.findUnique({
      where: { warehouseId_productId: { warehouseId: sourceWarehouseId, productId } }
    });

    if (!sourceStock || Number(sourceStock.availableQuantity) < quantity) {
      throw new BadRequestException('Insufficient available stock in source warehouse');
    }

    // Deduct from source
    await tx.inventoryStock.update({
      where: { id: sourceStock.id },
      data: {
        quantityOnHand: { decrement: quantity },
        availableQuantity: { decrement: quantity }
      }
    });

    // Add to dest
    let destStock = await tx.inventoryStock.findUnique({
      where: { warehouseId_productId: { warehouseId: destWarehouseId, productId } }
    });

    if (!destStock) {
      destStock = await tx.inventoryStock.create({
        data: {
          warehouseId: destWarehouseId,
          productId,
          quantityOnHand: quantity,
          availableQuantity: quantity,
          reservedQuantity: 0,
          minStockLevel: 0
        }
      });
    } else {
      await tx.inventoryStock.update({
        where: { id: destStock.id },
        data: {
          quantityOnHand: { increment: quantity },
          availableQuantity: { increment: quantity }
        }
      });
    }

    // Outbound movement
    await tx.stockMovement.create({
      data: {
        warehouseId: sourceWarehouseId,
        productId,
        movementType: 'OutboundTransfer',
        quantity: quantity,
        relatedType: 'Transfer',
        relatedId,
        createdBy: userId
      }
    });

    // Inbound movement
    await tx.stockMovement.create({
      data: {
        warehouseId: destWarehouseId,
        productId,
        movementType: 'InboundTransfer',
        quantity: quantity,
        relatedType: 'Transfer',
        relatedId,
        createdBy: userId
      }
    });
  }
}

