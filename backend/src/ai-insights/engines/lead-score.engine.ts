import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LeadScoreEngine {
  constructor(private prisma: PrismaService) {}

  async calculateAll() {
    const leads = await this.prisma.lead.findMany({
      where: { deletedAt: null, status: { notIn: ['Converted', 'Lost'] } },
      include: {
        presentations: true,
        visits: true,
        stage: true,
      }
    });

    const insights = [];
    const now = new Date();

    for (const lead of leads) {
      let score = 30; // Base score
      let factors = [];
      
      const daysSinceCreation = (now.getTime() - lead.createdAt.getTime()) / (1000 * 3600 * 24);
      let dataPoints = 0;

      if (lead.presentations && lead.presentations.length > 0) {
        score += 20;
        factors.push('[+] 20 امتیاز: انجام دمو/پرزنتیشن');
        dataPoints++;
      } else {
        factors.push('[-] بدون پرزنتیشن ثبت شده');
      }

      if (lead.visits && lead.visits.length > 0) {
        const visitScore = Math.min(20, lead.visits.length * 10);
        score += visitScore;
        factors.push(`[+] ${visitScore} امتیاز: انجام ${lead.visits.length} ویزیت`);
        dataPoints++;
      }

      if (lead.stage && lead.stage.order > 2) {
        score += 15;
        factors.push(`[+] 15 امتیاز: پیشرفت در قیف فروش (${lead.stage.name})`);
        dataPoints++;
      }

      const lastActivityDate = lead.updatedAt;
      const daysSinceActivity = (now.getTime() - lastActivityDate.getTime()) / (1000 * 3600 * 24);
      
      if (daysSinceActivity > 30) {
        score -= 20;
        factors.push('[-] 20 نمره منفی: بیش از یک ماه رکود و عدم فعالیت');
      } else if (daysSinceActivity < 7) {
        score += 10;
        factors.push('[+] 10 امتیاز: فعالیت و ارتباط در هفته اخیر');
        dataPoints++;
      }

      // Cap between 0 and 100
      score = Math.max(0, Math.min(100, score));

      // Confidence
      let confidence = 'Low';
      if (dataPoints >= 3) confidence = 'High';
      else if (dataPoints >= 1) confidence = 'Medium';

      let priority = 'Low';
      let recAction = 'تماس اولیه و بررسی نیازها';
      if (score >= 70) {
        priority = 'High';
        recAction = 'پیشنهاد جلسه نهایی فروش و ارسال پیش‌فاکتور (اولویت بالا)';
      } else if (score >= 40) {
        priority = 'Medium';
        recAction = 'پیگیری مستمر و نیازسنجی دقیق‌تر';
      }

      if (dataPoints === 0 && daysSinceCreation < 3) {
        factors.push('ℹ️ لید جدید: داده کافی برای تحلیل دقیق این مورد وجود ندارد.');
      }

      const reason = `این سرنخ دارای امتیاز ${score} از 100 است. ${score >= 70 ? 'پتانسیل بالایی برای تبدیل دارد.' : score >= 40 ? 'در حال بررسی و پیگیری است.' : 'احتمال تبدیل پایینی دارد و نیازمند توجه است.'}`;

      const insightDescription = `**امتیاز (Score):** ${score}
**سطح اطمینان (Confidence):** ${confidence}

**فاکتورهای تاثیرگذار:**
${factors.map(f => '- ' + f).join('\n')}

**استدلال (Reasoning):**
${reason}

**اقدام پیشنهادی:**
${recAction}

*(منبع داده: سیستم CRM داخلی - Deterministic Score)*`;

      insights.push({
        insightType: 'LeadScore',
        entityType: 'Lead',
        entityId: lead.id,
        score,
        priority,
        insightTitle: `امتیاز سرنخ: ${score} (${priority})`,
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

