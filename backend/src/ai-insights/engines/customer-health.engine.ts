import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CustomerHealthEngine {
  constructor(private prisma: PrismaService) {}

  async calculateAll() {
    const customers = await this.prisma.customer.findMany({
      where: { deletedAt: null },
      include: {
        orders: { orderBy: { createdAt: 'desc' } },
        visits: { orderBy: { scheduledAt: 'desc' }, take: 1 }
      }
    });

    const insights = [];
    const now = new Date();

    for (const c of customers) {
      if (c.orders.length === 0) continue; // Skip leads

      let score = 50; // Base neutral score
      let factors = [];
      let dataPoints = 0;

      // Purchase frequency
      const orderCount = c.orders.length;
      if (orderCount > 10) {
        score += 20;
        factors.push(`[+] 20 امتیاز: مشتری وفادار با تعداد سفارش بالا (${orderCount} سفارش)`);
        dataPoints++;
      } else if (orderCount > 2) {
        score += 10;
        factors.push(`[+] 10 امتیاز: خرید مکرر (${orderCount} سفارش)`);
        dataPoints++;
      } else {
        factors.push(`[-] خرید محدود (${orderCount} سفارش)`);
      }

      // Order recency
      const lastOrder = c.orders[0];
      const daysSinceOrder = (now.getTime() - lastOrder.createdAt.getTime()) / (1000 * 3600 * 24);
      if (daysSinceOrder < 30) {
        score += 15;
        factors.push(`[+] 15 امتیاز: ثبت سفارش در ۳۰ روز اخیر`);
        dataPoints++;
      } else if (daysSinceOrder > 90) {
        score -= 20;
        factors.push(`[-] 20 نمره منفی: عدم ثبت سفارش در بیش از ۹۰ روز`);
        dataPoints++;
      }

      // Open tasks removed (Schema doesn't support tasks on Customer directly)

      // Visits
      const lastVisit = c.visits.length > 0 ? c.visits[0] : null;
      if (lastVisit) {
        const daysSinceVisit = (now.getTime() - lastVisit.scheduledAt.getTime()) / (1000 * 3600 * 24);
        if (daysSinceVisit < 30) {
          score += 10;
          factors.push(`[+] 10 امتیاز: ویزیت اخیر (کمتر از یک ماه)`);
          dataPoints++;
        }
      }

      score = Math.max(0, Math.min(100, score));

      let healthStatus = 'Critical';
      let priority = 'High';
      let recAction = 'رسیدگی فوری به مشکلات مشتری';
      
      if (score >= 70) {
        healthStatus = 'Healthy';
        priority = 'Low';
        recAction = 'پیشنهاد بیش‌فروشی (Upsell) یا ایجاد لایالتی کلاب';
      } else if (score >= 40) {
        healthStatus = 'At Risk';
        priority = 'Medium';
        recAction = 'تماس مدیر جهت بررسی سطح رضایت';
      }

      let confidence = 'Low';
      if (dataPoints >= 3) confidence = 'High';
      else if (dataPoints >= 1) confidence = 'Medium';

      const reason = `امتیاز سلامت مشتری ${score} است. وضعیت فعلی او ${healthStatus} ارزیابی می‌شود.`;

      const insightDescription = `**امتیاز سلامت (Health Score):** ${score} (${healthStatus})
**سطح اطمینان (Confidence):** ${confidence}

**فاکتورهای تاثیرگذار:**
${factors.map(f => '- ' + f).join('\n')}

**استدلال (Reasoning):**
${reason}

**اقدام پیشنهادی:**
${recAction}

*(منبع داده: سیستم CRM داخلی - Deterministic Score)*`;

      insights.push({
        insightType: 'CustomerHealth',
        entityType: 'Customer',
        entityId: c.id,
        score,
        priority,
        insightTitle: `سلامت مشتری: ${healthStatus} (${score})`,
        insightDescription,
        recommendedAction: recAction,
        modelName: 'Hybrid_Deterministic_v2',
        modelVersion: '2.0',
        status: 'Pending'
      });
    }

    return insights;
  }
}
