import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ContextBuilderService {
  constructor(private prisma: PrismaService) {}

  async buildContext(intent: string): Promise<string> {
    let context = '';

    if (intent === 'sales_summary') {
      const orders = await this.prisma.order.findMany({
        where: { status: 'Delivered' },
        select: { id: true, totalAmount: true, createdAt: true, territory: { select: { name: true } }, user: { select: { username: true } } }
      });
      const total = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
      context += `Total Delivered Orders: ${orders.length}\nTotal Sales Amount: ${total}\n`;
    }

    if (intent === 'top_users') {
      const kpis = await this.prisma.kPITarget.findMany({
        include: { user: { select: { username: true } } },
        orderBy: { salesAchievementPercent: 'desc' },
        take: 5
      });
      context += 'Top 5 Sales Representatives based on KPI:\n';
      kpis.forEach((k, i) => context += `${i+1}. ${k.user.username} (Target: ${k.targetSalesAmount}, Actual: ${k.actualSalesAmount}, Achievement: ${k.salesAchievementPercent}%)\n`);
    }

    if (intent === 'churn_risk') {
      const insights = await this.prisma.aIInsight.findMany({
        where: { insightType: 'ChurnRisk', status: 'Applied' },
        orderBy: { score: 'desc' },
        take: 10
      });
      context += 'Customers at high risk of churn:\n';
      insights.forEach(i => context += `- Entity ID: ${i.entityId}, Score: ${i.score}, Reason: ${i.insightDescription}\n`);
    }

    if (intent === 'financials') {
      const cheques = await this.prisma.cheque.findMany({
        select: { id: true, amount: true, status: true, dueDate: true }
      });
      const bounced = cheques.filter(c => c.status === 'Bounced');
      const totalBounced = bounced.reduce((sum, c) => sum + Number(c.amount), 0);
      context += `Financial Summary:\nTotal Cheques: ${cheques.length}\nBounced Cheques Count: ${bounced.length}\nTotal Bounced Amount: ${totalBounced}\n`;
    }

    if (!context) {
      context = 'System context is empty for this query.';
    }

    return context;
  }
}
