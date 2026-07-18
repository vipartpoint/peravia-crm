import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ManagerAlertsEngine {
  constructor(private prisma: PrismaService) {}

  async calculateAll() {
    const insights = [];

    // Pending Orders Alert
    const pendingOrders = await this.prisma.order.count({
      where: { status: 'PendingApproval', deletedAt: null }
    });

    if (pendingOrders > 0) {
      insights.push({
        insightType: 'ManagerAlert',
        entityType: 'System',
        entityId: 'PENDING_APPROVAL_ORDERS',
        score: pendingOrders * 10, // priority increases with more orders
        priority: pendingOrders > 5 ? 'High' : 'Medium',
        insightTitle: 'سفارشات معطل',
        insightDescription: `${pendingOrders} سفارش در انتظار تأیید مدیریت قرار دارند.`,
        recommendedAction: 'بررسی و تأیید/رد سفارشات در پنل مدیریت',
        modelName: 'RuleBased_v1',
        modelVersion: '1.0',
        status: 'Applied'
      });
    }

    // Weak Territories
    const territories = await this.prisma.territory.findMany({
      include: {
        _count: { select: { visits: true } }
      }
    });

    for (const t of territories) {
      if (t._count.visits === 0 && t.type === 'SalesRegion') {
         insights.push({
          insightType: 'ManagerAlert',
          entityType: 'System',
          entityId: `WEAK_TERRITORY_${t.id}`,
          score: 80,
          priority: 'High',
          insightTitle: `منطقه بدون ویزیت: ${t.name}`,
          insightDescription: `هیچ ویزیتی در این منطقه فروش ثبت نشده است.`,
          recommendedAction: 'تخصیص کارشناس جدید یا ارزیابی مجدد منطقه',
          modelName: 'RuleBased_v1',
          modelVersion: '1.0',
          status: 'Applied'
        });
      }
    }

    return insights;
  }
}
