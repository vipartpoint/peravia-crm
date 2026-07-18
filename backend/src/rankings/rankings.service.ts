import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RankingsService {
  constructor(private prisma: PrismaService) {}

  async getRankings() {
    // Top Sales Reps (based on collectedAmount from orders in current month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // This is a simplified ranking for MVP. We use the KpiTargets to get actuals.
    const kpis = await this.prisma.kPITarget.findMany({
      where: { periodStart: { lte: now }, periodEnd: { gte: now } },
      include: { user: { select: { username: true, role: { select: { name: true } } } }, territory: { select: { name: true } } }
    });

    const reps = kpis.filter((k: any) => k.user?.role?.name === 'SalesRep');
    
    // Sort by achievement
    const topReps = reps.sort((a, b) => Number(b.collectionAchievementPercent) - Number(a.collectionAchievementPercent)).slice(0, 5);

    // Top Territories
    const territoryScores: any = {};
    for (const k of kpis as any[]) {
      if (k.territoryId && k.territory) {
        if (!territoryScores[k.territory.name]) {
          territoryScores[k.territory.name] = { name: k.territory.name, totalSales: 0, totalCollected: 0 };
        }
        territoryScores[k.territory.name].totalSales += Number(k.actualSalesAmount);
        territoryScores[k.territory.name].totalCollected += Number(k.actualCollectedAmount);
      }
    }

    const topTerritories = Object.values(territoryScores)
      .sort((a: any, b: any) => b.totalCollected - a.totalCollected)
      .slice(0, 5);

    // Top Customers
    const customers = await this.prisma.customer.findMany({
      include: { orders: { where: { status: { in: ['Approved', 'Delivered'] } } } }
    });

    const custScores = customers.map(c => {
      const totalCollected = c.orders.reduce((sum, o) => sum + Number(o.collectedAmount), 0);
      return { id: c.id, name: c.name, totalCollected };
    });

    const topCustomers = custScores.sort((a, b) => b.totalCollected - a.totalCollected).slice(0, 5);

    return {
      topReps: topReps.map((r: any) => ({ id: r.id, name: r.user.username, percent: Number(r.collectionAchievementPercent), collected: Number(r.actualCollectedAmount) })),
      topTerritories,
      topCustomers
    };
  }
}
