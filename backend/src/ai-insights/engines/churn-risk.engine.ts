import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ChurnRiskEngine {
  constructor(private prisma: PrismaService) {}

  async calculateAll() {
    const customers = await this.prisma.customer.findMany({
      where: { deletedAt: null },
      include: {
        orders: { orderBy: { createdAt: 'desc' } },
        visits: { orderBy: { scheduledAt: 'desc' } }
      }
    });

    const insights = [];
    const now = new Date();

    for (const c of customers) {
      if (c.orders.length === 0) continue; // Skip if never ordered (maybe a lead)

      let score = 0;
      let factors = [];
      let dataPoints = 0;

      const lastOrder = c.orders[0];
      const daysSinceOrder = (now.getTime() - lastOrder.createdAt.getTime()) / (1000 * 3600 * 24);
      
      if (daysSinceOrder > 90) {
        score += 50;
        factors.push(`[-] 50 نمره ریسک: بیش از ۳ ماه عدم ثبت سفارش (${Math.round(daysSinceOrder)} روز)`);
        dataPoints++;
      } else if (daysSinceOrder > 45) {
        score += 30;
        factors.push(`[-] 30 نمره ریسک: بیش از ۴۵ روز عدم ثبت سفارش`);
        dataPoints++;
      } else {
        factors.push(`[+] ثبت سفارش در دوره اخیر (${Math.round(daysSinceOrder)} روز پیش)`);
        dataPoints++;
      }

      const lastVisit = c.visits.length > 0 ? c.visits[0] : null;
      let daysSinceVisit = 999;
      if (lastVisit) {
        daysSinceVisit = (now.getTime() - lastVisit.scheduledAt.getTime()) / (1000 * 3600 * 24);
        if (daysSinceVisit > 60) {
          score += 20;
          factors.push(`[-] 20 نمره ریسک: عدم ویزیت/تعامل در ۶۰ روز گذشته`);
          dataPoints++;
        } else {
          factors.push(`[+] تعامل منظم (آخرین ویزیت ${Math.round(daysSinceVisit)} روز پیش)`);
          dataPoints++;
        }
      } else {
        score += 15;
        factors.push(`[-] 15 نمره ریسک: هیچ سابقه ویزیتی ثبت نشده است`);
      }

      // Overdue payments (Mock calculation for MVP if receivables are not joined)
      // Since we don't have direct access to overdue amount here, we assume standard behavior or skip.
      
      // Calculate order volume drop (comparing last 6 months to previous 6 months)
      const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 3600 * 1000);
      const twelveMonthsAgo = new Date(now.getTime() - 360 * 24 * 3600 * 1000);
      
      const ordersLast6M = c.orders.filter(o => o.createdAt >= sixMonthsAgo).length;
      const ordersPrev6M = c.orders.filter(o => o.createdAt >= twelveMonthsAgo && o.createdAt < sixMonthsAgo).length;

      if (ordersPrev6M > 0) {
        if (ordersLast6M === 0) {
          score += 30;
          factors.push(`[-] 30 نمره ریسک: توقف کامل خرید در ۶ ماه گذشته نسبت به قبل`);
          dataPoints++;
        } else if (ordersLast6M < (ordersPrev6M / 2)) {
          score += 15;
          factors.push(`[-] 15 نمره ریسک: افت شدید حجم سفارشات (بیش از ۵۰٪ کاهش)`);
          dataPoints++;
        }
      }

      score = Math.max(0, Math.min(100, score));

      let priority = 'Low';
      let riskLevel = 'Safe';
      let title = 'وضعیت ایمن';
      let recAction = 'حفظ ارتباط مستمر';

      if (score >= 70) {
        priority = 'High';
        riskLevel = 'Critical';
        title = 'ریسک بحرانی ریزش';
        recAction = 'تماس فوری مدیر فروش، ارسال آفر ویژه و پیگیری علت عدم خرید';
      } else if (score >= 40) {
        priority = 'Medium';
        riskLevel = 'At Risk';
        title = 'در معرض خطر (At Risk)';
        recAction = 'برنامه‌ریزی ویزیت حضوری در اسرع وقت';
      }

      let confidence = 'Low';
      if (dataPoints >= 3) confidence = 'High';
      else if (dataPoints >= 2) confidence = 'Medium';

      if (dataPoints === 0 && daysSinceOrder < 30) {
        factors.push('ℹ️ مشتری جدید: داده تاریخی کافی برای پیش‌بینی دقیق ریزش وجود ندارد.');
      }

      const reason = `این مشتری نمره ریسک ریزش ${score} از 100 را دریافت کرده است. وضعیت فعلی او ${riskLevel} است.`;

      const insightDescription = `**ریسک ریزش (Risk Score):** ${score} (${riskLevel})
**سطح اطمینان (Confidence):** ${confidence}

**فاکتورهای تاثیرگذار:**
${factors.map(f => '- ' + f).join('\n')}

**استدلال (Reasoning):**
${reason}

**اقدام پیشنهادی:**
${recAction}

*(منبع داده: سیستم CRM داخلی - Deterministic Score)*`;

      if (score >= 40) { // Only store insights for at-risk customers to prevent noise
        insights.push({
          insightType: 'ChurnRisk',
          entityType: 'Customer',
          entityId: c.id,
          score,
          priority,
          insightTitle: title,
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
