import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FollowupRecommendationEngine {
  constructor(private prisma: PrismaService) {}

  async calculateAll() {
    const leads = await this.prisma.lead.findMany({
      where: { deletedAt: null, status: { notIn: ['Converted', 'Lost'] } }
    });

    const insights = [];
    const now = new Date();

    for (const lead of leads) {
      if (lead.nextFollowUpAt && lead.nextFollowUpAt < now) {
        const daysPast = Math.floor((now.getTime() - lead.nextFollowUpAt.getTime()) / (1000 * 3600 * 24));
        
        insights.push({
          insightType: 'FollowupRecommendation',
          entityType: 'Lead',
          entityId: lead.id,
          score: 95,
          priority: 'High',
          insightTitle: 'نیاز فوری به پیگیری',
          insightDescription: `حدود ${daysPast} روز از زمان برنامه‌ریزی شده برای پیگیری این لید گذشته است.`,
          recommendedAction: 'برقراری تماس فوری با مدیریت',
          modelName: 'RuleBased_v1',
          modelVersion: '1.0',
          status: 'Applied'
        });
      }
    }

    return insights;
  }
}
