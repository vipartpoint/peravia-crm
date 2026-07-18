import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KpiService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: any) {
    let whereClause: any = {};
    if (user.role.name === 'SalesRep') {
      whereClause.userId = user.id;
    } else if (user.role.name === 'RegionalManager') {
      const territories = await this.prisma.territory.findMany({ where: { managerId: user.id }, select: { id: true } });
      const users = await this.prisma.user.findMany({ where: { territoryId: { in: territories.map(t => t.id) } }, select: { id: true } });
      whereClause.userId = { in: users.map(u => u.id) };
    }

    return this.prisma.kPITarget.findMany({
      where: whereClause,
      include: { user: { select: { username: true } }, territory: { select: { name: true } } },
      orderBy: { periodStart: 'desc' }
    });
  }

  async recalculateAll(user: any) {
    const targets = await this.prisma.kPITarget.findMany();
    
    for (const target of targets) {
      // Find valid dates
      const start = new Date(target.periodStart);
      const end = new Date(target.periodEnd);

      // 1. actualSalesAmount & actualOrdersCount (from approved/delivered orders)
      const orders = await this.prisma.order.findMany({
        where: {
          userId: target.userId,
          status: { in: ['Approved', 'Delivered'] },
          createdAt: { gte: start, lte: end },
          deletedAt: null
        }
      });
      const actualSalesAmount = orders.reduce((s, o) => s + Number(o.totalAmount), 0);
      const actualOrdersCount = orders.length;

      // 2. actualCollectedAmount (from confirmed payments for this user's orders)
      const payments = await this.prisma.payment.findMany({
        where: {
          order: { userId: target.userId },
          status: 'Confirmed',
          paymentDate: { gte: start, lte: end },
          deletedAt: null
        }
      });
      const actualCollectedAmount = payments.reduce((s, p) => s + Number(p.amount), 0);

      // 3. actualVisitsCount (from completed visits)
      const visits = await this.prisma.visit.findMany({
        where: {
          userId: target.userId,
          status: 'Completed',
          completedAt: { gte: start, lte: end },
          deletedAt: null
        }
      });
      const actualVisitsCount = visits.length;

      // 4. actualNewCustomers (created in period)
      const customers = await this.prisma.customer.findMany({
        where: {
          createdBy: target.userId,
          createdAt: { gte: start, lte: end },
          deletedAt: null
        }
      });
      const actualNewCustomers = customers.length;

      // 5. actualLeadConversions
      const leads = await this.prisma.lead.findMany({
        where: {
          assignedTo: target.userId,
          status: 'Converted',
          updatedAt: { gte: start, lte: end }, // Approximation since we don't have exact convertedAt
          deletedAt: null
        }
      });
      const actualLeadConversions = leads.length;

      // Calculate Percentages
      const safeCalc = (actual: number, targetValue: number) => targetValue > 0 ? (actual / targetValue) * 100 : (actual > 0 ? 100 : 0);

      const salesAchievementPercent = safeCalc(actualSalesAmount, Number(target.targetSalesAmount));
      const collectionAchievementPercent = safeCalc(actualCollectedAmount, Number(target.targetCollectedAmount));
      const visitAchievementPercent = safeCalc(actualVisitsCount, target.targetVisitsCount);
      const conversionAchievementPercent = safeCalc(actualLeadConversions, target.targetLeadConversions);

      await this.prisma.kPITarget.update({
        where: { id: target.id },
        data: {
          actualSalesAmount,
          actualCollectedAmount,
          actualOrdersCount,
          actualVisitsCount,
          actualNewCustomers,
          actualLeadConversions,
          salesAchievementPercent,
          collectionAchievementPercent,
          visitAchievementPercent,
          conversionAchievementPercent
        }
      });
    }

    await this.prisma.auditLog.create({
      data: { userId: user.id, action: 'RECALCULATE_KPI', entityType: 'System', entityId: 'ALL' }
    });

    return { message: 'KPI Recalculated successfully' };
  }
}
