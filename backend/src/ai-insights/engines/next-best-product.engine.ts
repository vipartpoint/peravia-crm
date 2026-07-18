import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NextBestProductEngine {
  constructor(private prisma: PrismaService) {}

  async calculateAll() {
    const customers = await this.prisma.customer.findMany({
      where: { deletedAt: null },
      include: {
        orders: {
          include: { items: { include: { product: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    const insights = [];

    for (const c of customers) {
      if (c.orders.length === 0) continue;

      // Extract all bought products
      const boughtProducts = new Set();
      for (const o of c.orders) {
        for (const i of o.items) {
          boughtProducts.add(i.product.name);
        }
      }

      // Simple rule: If they bought something, recommend Pravia Ultra 5W-30 if not bought, else Gertex
      let recommendation = 'Pravia Ultra 5W-30';
      if (boughtProducts.has('Pravia Ultra 5W-30')) {
        recommendation = 'Gertex Max 10W-40';
      }

      insights.push({
        insightType: 'NextBestProduct',
        entityType: 'Customer',
        entityId: c.id,
        score: 85,
        priority: 'Medium',
        insightTitle: `پیشنهاد محصول: ${recommendation}`,
        insightDescription: `بر اساس تاریخچه خرید، این مشتری احتمالاً به محصول جدید نیاز دارد.`,
        recommendedAction: `ارسال کاتالوگ یا سمپل از ${recommendation} در ویزیت بعدی`,
        modelName: 'RuleBased_v1',
        modelVersion: '1.0',
        status: 'Applied'
      });
    }

    return insights;
  }
}
