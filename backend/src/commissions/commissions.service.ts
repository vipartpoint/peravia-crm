import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommissionsService {
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

    return this.prisma.commission.findMany({
      where: whereClause,
      include: { user: { select: { username: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  async calculateCommissions(user: any) {
    // For MVP, we calculate commissions based on current month KPI targets
    const targets = await this.prisma.kPITarget.findMany({
      where: { periodType: 'Monthly' }
    });

    for (const target of targets) {
      // Find period string
      const periodStr = `${target.periodStart.getFullYear()}-${(target.periodStart.getMonth() + 1).toString().padStart(2, '0')}`;
      
      const achievement = Number(target.collectionAchievementPercent);
      let rate = 0;

      if (achievement < 70) {
        rate = 0;
      } else if (achievement < 100) {
        rate = 1.0;
      } else if (achievement <= 120) {
        rate = 1.5;
      } else {
        rate = 2.0;
      }

      const collected = Number(target.actualCollectedAmount);
      const commissionAmount = (collected * rate) / 100;

      // Upsert commission (Draft)
      const existing = await this.prisma.commission.findFirst({
        where: { userId: target.userId, period: periodStr }
      });

      if (existing) {
        if (existing.status === 'Draft') {
          await this.prisma.commission.update({
            where: { id: existing.id },
            data: {
              salesAmount: target.actualSalesAmount,
              collectedAmount: target.actualCollectedAmount,
              commissionRate: rate,
              commissionAmount: commissionAmount
            }
          });
        }
      } else {
        await this.prisma.commission.create({
          data: {
            userId: target.userId,
            period: periodStr,
            salesAmount: target.actualSalesAmount,
            collectedAmount: target.actualCollectedAmount,
            commissionRate: rate,
            commissionAmount: commissionAmount,
            status: 'Draft'
          }
        });
      }
    }

    return { message: 'Commissions recalculated successfully' };
  }

  async updateStatus(id: string, status: string, user: any) {
    const commission = await this.prisma.commission.findUnique({ where: { id } });
    if (!commission) throw new NotFoundException();

    if (status === 'Approved' && !['CEO', 'SalesManager'].includes(user.role.name)) {
      throw new ForbiddenException('Only CEO or SalesManager can approve commissions');
    }

    if (status === 'Paid' && user.role.name !== 'Finance') {
      throw new ForbiddenException('Only Finance can pay commissions');
    }

    const data: any = { status };
    if (status === 'Approved') data.approvedBy = user.id;
    if (status === 'Paid') data.paidAt = new Date();

    const updated = await this.prisma.commission.update({
      where: { id },
      data
    });

    await this.prisma.auditLog.create({
      data: {
        userId: user.id, action: status === 'Approved' ? 'APPROVE_COMMISSION' : 'PAY_COMMISSION',
        entityType: 'Commission', entityId: id
      }
    });

    return updated;
  }
}
