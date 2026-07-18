import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OpportunityDetectionEngine {
  constructor(private prisma: PrismaService) {}

  async calculateAll() {
    const customers = await this.prisma.customer.findMany({
      where: { deletedAt: null },
      include: {
        orders: { orderBy: { createdAt: 'desc' } }
      }
    });

    const insights = [];
    const now = new Date();

    for (const c of customers) {
      if (c.orders.length === 0) continue; 

      let score = 0;
      let factors = [];
      let dataPoints = 0;

      const orderCount = c.orders.length;
      const totalSpend = c.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
      const lastOrder = c.orders[0];
      const daysSinceOrder = (now.getTime() - lastOrder.createdAt.getTime()) / (1000 * 3600 * 24);

      let opportunityType = '';
      let recAction = '';
      let priority = 'Low';

      // 1. Reactivation Opportunity (High Spend, High Inactivity)
      if (daysSinceOrder > 120 && totalSpend > 500000000) { // arbitrary threshold for high spend
        score = 85;
        priority = 'High';
        opportunityType = 'Reactivation';
        factors.push(`[+] حجم خرید بالا در گذشته (${totalSpend.toLocaleString()} ریال)`);
        factors.push(`[+] عدم ثبت سفارش در بیش از ۴ ماه گذشته`);
        recAction = 'تماس بازاریابی با پیشنهاد تخفیف بازگشت (Win-back)';
        dataPoints += 2;
      }
      // 2. Upsell Opportunity (Recent purchase, high frequency)
      else if (daysSinceOrder < 15 && orderCount >= 5) {
        score = 75;
        priority = 'Medium';
        opportunityType = 'Upsell';
        factors.push(`[+] خرید اخیر (${Math.round(daysSinceOrder)} روز پیش)`);
        factors.push(`[+] مشتری وفادار و فعال (${orderCount} سفارش موفق)`);
        recAction = 'معرفی محصولات مکمل (Cross-sell / Upsell) در سفارش بعدی';
        dataPoints += 2;
      }
      // 3. Follow-up Opportunity (Steady buyer hasn't bought in expected window)
      else if (daysSinceOrder > 30 && daysSinceOrder <= 60 && orderCount > 2) {
        score = 60;
        priority = 'Medium';
        opportunityType = 'Follow-up';
        factors.push(`[+] مشتری مستمر که چرخه خریدش به تاخیر افتاده است`);
        factors.push(`[-] عبور از پنجره خرید ۳۰ روزه`);
        recAction = 'تماس دوره‌ای و پرسش از موجودی کالا (موجودی‌گیری)';
        dataPoints += 2;
      }

      if (score >= 50) {
        let confidence = dataPoints >= 2 ? 'High' : 'Medium';
        const reason = `الگوریتم فرصت فروش از نوع ${opportunityType} را با امتیاز ${score} شناسایی کرده است.`;

        const insightDescription = `**نوع فرصت:** ${opportunityType}
**امتیاز (Score):** ${score}
**سطح اطمینان (Confidence):** ${confidence}

**فاکتورهای تاثیرگذار:**
${factors.map(f => '- ' + f).join('\n')}

**استدلال (Reasoning):**
${reason}

**اقدام پیشنهادی:**
${recAction}

*(منبع داده: سیستم CRM داخلی - Deterministic Score)*`;

        insights.push({
          insightType: 'NextBestProduct', // Mapping to existing UI Insight Type equivalent
          entityType: 'Customer',
          entityId: c.id,
          score,
          priority,
          insightTitle: `فرصت فروش: ${opportunityType}`,
          insightDescription,
          recommendedAction: recAction,
          modelName: 'Hybrid_Deterministic_v2',
          modelVersion: '2.0',
          status: 'Pending'
        });
      }
    }

    return insights;
  }
}
