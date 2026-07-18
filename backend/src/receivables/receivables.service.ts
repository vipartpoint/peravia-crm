import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReceivablesService {
  constructor(private prisma: PrismaService) {}

  async getCustomerReceivables(customerId?: string, user?: any) {
    let whereClause: any = { deletedAt: null };
    
    if (customerId) {
      whereClause.id = customerId;
    }

    if (user && user.role.name === 'SalesRep') {
      whereClause.createdBy = user.id;
    }

    const customers = await this.prisma.customer.findMany({
      where: whereClause,
      include: {
        orders: { where: { deletedAt: null } },
        cheques: { where: { deletedAt: null } },
        payments: { where: { deletedAt: null } },
      }
    });

    return customers.map(c => {
      const totalOrdersAmount = c.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
      
      const confirmedPayments = c.payments.filter(p => p.status === 'Confirmed');
      const totalConfirmedPayments = confirmedPayments.reduce((sum, p) => sum + Number(p.amount), 0);

      const registeredCheques = c.cheques.filter(ch => ch.status === 'Registered' || ch.status === 'NearDue');
      const clearedCheques = c.cheques.filter(ch => ch.status === 'Cleared');
      const bouncedCheques = c.cheques.filter(ch => ch.status === 'Bounced');

      const totalRegisteredCheques = registeredCheques.reduce((sum, ch) => sum + Number(ch.amount), 0);
      const totalClearedCheques = clearedCheques.reduce((sum, ch) => sum + Number(ch.amount), 0);
      const totalBouncedCheques = bouncedCheques.reduce((sum, ch) => sum + Number(ch.amount), 0);

      // Total collected and unpaid
      const totalCollectedAmount = totalConfirmedPayments + totalClearedCheques;
      const totalUnpaidAmount = Math.max(0, totalOrdersAmount - totalCollectedAmount);

      // Overdue orders are delivered orders with uncollected amount
      const overdueOrders = c.orders.filter(o => o.status === 'Delivered' && Number(o.uncollectedAmount) > 0);
      const overdueAmount = overdueOrders.reduce((sum, o) => sum + Number(o.uncollectedAmount), 0);

      const creditLimit = Number(c.creditLimit || 500000000);
      const creditUsed = totalUnpaidAmount;
      const remainingCredit = Math.max(0, creditLimit - creditUsed);

      let riskStatus = 'Normal';
      if (c.status === 'Blocked') {
        riskStatus = 'Blocked';
      } else if (bouncedCheques.length > 0 || overdueAmount > creditLimit * 0.5) {
        riskStatus = 'HighRisk';
      } else if (overdueAmount > 0 || remainingCredit < creditLimit * 0.2) {
        riskStatus = 'Warning';
      }

      return {
        customer: { id: c.id, name: c.name, phone: c.phone },
        totalOrdersAmount,
        totalConfirmedPayments,
        totalClearedCheques,
        totalUnpaidAmount,
        pendingChequeAmount: totalRegisteredCheques,
        bouncedChequeAmount: totalBouncedCheques,
        overdueAmount,
        creditLimit,
        creditUsed,
        remainingCredit,
        riskStatus
      };
    });
  }

  async getOne(customerId: string, user: any) {
    const data = await this.getCustomerReceivables(customerId, user);
    if (!data.length) throw new NotFoundException('Customer not found');
    await this.logAudit(user.id, 'VIEW_RECEIVABLES', customerId);
    return data[0];
  }

  async getCustomerRiskAndCredit(customerId: string) {
    // Internal helper bypassing user permission check
    const data = await this.getCustomerReceivables(customerId);
    if (!data.length) return null;
    return data[0];
  }

  async getSummary(user: any) {
    const data = await this.getCustomerReceivables(undefined, user);
    return {
      totalUncollected: data.reduce((s, c) => s + c.totalUnpaidAmount, 0),
      totalOverdue: data.reduce((s, c) => s + c.overdueAmount, 0),
      totalBounced: data.reduce((s, c) => s + c.bouncedChequeAmount, 0),
      highRiskCustomers: data.filter(c => ['HighRisk', 'Blocked'].includes(c.riskStatus)).length
    };
  }

  private async logAudit(userId: string, action: string, entityId: string) {
    await this.prisma.auditLog.create({
      data: {
        userId, action, entityType: 'Customer', entityId,
      }
    });
  }
}
