import { EncryptionUtil } from '../utils/encryption.util';
import { FinancialCalculationService } from '../financial/financial-calculation.service';
import { InventoryService } from '../inventory/inventory.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private financialCalc: FinancialCalculationService,
    private inventoryService: InventoryService
  ) {}

  async create(data: any, user: any) {
    if (data.orderId) {
      const shortages = await this.prisma.inventoryShortageRequest.count({
        where: { orderId: data.orderId, status: { in: ['PendingWarehouseManager', 'PendingProductionManager'] } }
      });
      if (shortages > 0) {
        throw new BadRequestException('Cannot collect payment while feasibility review (shortage request) is pending.');
      }
    }

    const encryptedRef = data.referenceNumber ? EncryptionUtil.encrypt(data.referenceNumber) : null;

    const payment = await this.prisma.payment.create({
      data: {
        customerId: data.customerId,
        orderId: data.orderId || null,
        chequeId: data.chequeId || null,
        amount: data.amount,
        paymentDate: new Date(data.paymentDate || new Date()),
        method: data.method,
        referenceNumber: encryptedRef,
        status: 'Pending',
        notes: data.notes,
        createdBy: user.id,
      },
    });

    await this.logAudit(user.id, 'CREATE_PAYMENT', payment.id, null, payment);
    return payment;
  }

  async findAll(user: any) {
    const whereClause: any = { deletedAt: null };

    if (user.role.name === 'SalesRep') {
      const allowedCustomers = await this.prisma.customer.findMany({
        where: { createdBy: user.id },
        select: { id: true }
      });
      whereClause.customerId = { in: allowedCustomers.map((c: any) => c.id) };
    }

    const payments = await this.prisma.payment.findMany({
      where: whereClause,
      include: { customer: true, order: true },
      orderBy: { paymentDate: 'desc' }
    });

    return payments.map((p: any) => {
      const decrypted = p.referenceNumber ? EncryptionUtil.decrypt(p.referenceNumber) : null;
      const masked = decrypted ? `****${decrypted.slice(-4)}` : null;
      return { ...p, referenceNumber: masked };
    });
  }

  async updateStatus(id: string, status: string, user: any) {
    if (!['Finance', 'CEO'].includes(user.role.name)) {
      throw new ForbiddenException('Only Finance and CEO can confirm payments');
    }

    const payment = await this.prisma.payment.findUnique({ where: { id }, include: { order: true } });
    if (!payment) throw new NotFoundException();
    if (payment.status === status) return payment;

    const updated = await this.prisma.payment.update({
      where: { id },
      data: { status, confirmedBy: user.id }
    });

    await this.logAudit(user.id, status === 'Confirmed' ? 'CONFIRM_PAYMENT' : 'REJECT_PAYMENT', id, payment.status, status);

    // Update order amounts if confirmed
    if (status === 'Confirmed' && payment.orderId) {
      await this.financialCalc.recalculateOrderPaymentStatus(payment.orderId);
      await this.inventoryService.deductRealStockAfterPayment(payment.orderId, user.id);
    }
    // If it was confirmed and now rejected or cancelled, recalculate as well
    if (payment.status === 'Confirmed' && status !== 'Confirmed' && payment.orderId) {
      await this.financialCalc.recalculateOrderPaymentStatus(payment.orderId);
    }

    return updated;
  }



  private async logAudit(userId: string, action: string, entityId: string, oldValue: any, newValue: any) {
    await this.prisma.auditLog.create({
      data: {
        userId, action, entityType: 'Payment', entityId,
        oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
        newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
      }
    });
  }
}
