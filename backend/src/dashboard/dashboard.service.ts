import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  private getBaseWhereClause(user: any, prefix = '') {
    if (user.role.name === 'SalesRep') {
      return prefix ? { [`${prefix}Id`]: user.id } : { userId: user.id };
    }
    if (user.role.name === 'RegionalManager') {
      return { territoryId: user.territoryId };
    }
    return {};
  }

  async getOverview(user: any, startDate: Date, endDate: Date) {
    const baseWhere = this.getBaseWhereClause(user);
    const assignedWhere = user.role.name === 'SalesRep' ? { assignedTo: user.id } : this.getBaseWhereClause(user);
    const leadWhere = user.role.name === 'SalesRep' ? { assignedTo: user.id } : this.getBaseWhereClause(user);
    
    // In our Customer model, we don't have assignedTo or territoryId directly, let's use createdBy or no filter for MVP
    const cWhere = user.role.name === 'SalesRep' ? { createdBy: user.id } : {};

    const [
      totalCustomers,
      activeCustomers,
      totalLeads,
      newLeadsThisPeriod,
      convertedLeadsThisPeriod,
      totalOrders,
      ordersThisPeriod,
      pendingApprovalOrders,
      overdueTasks,
      visitsThisPeriod,
      completedVisitsThisPeriod,
      salesThisPeriodAgg,
      totalSalesAgg
    ] = await Promise.all([
      this.prisma.customer.count({ where: { deletedAt: null, ...cWhere } }),
      this.prisma.customer.count({ where: { deletedAt: null, ...cWhere } }), // Simplify active for now
      this.prisma.lead.count({ where: { deletedAt: null, ...leadWhere } }),
      this.prisma.lead.count({ where: { deletedAt: null, createdAt: { gte: startDate, lte: endDate }, ...leadWhere } }),
      this.prisma.lead.count({ where: { deletedAt: null, status: 'Converted', updatedAt: { gte: startDate, lte: endDate }, ...leadWhere } }),
      this.prisma.order.count({ where: { deletedAt: null, ...baseWhere } }),
      this.prisma.order.count({ where: { deletedAt: null, createdAt: { gte: startDate, lte: endDate }, ...baseWhere } }),
      this.prisma.order.count({ where: { deletedAt: null, status: 'PendingApproval', ...baseWhere } }),
      this.prisma.task.count({ where: { deletedAt: null, dueAt: { lt: new Date() }, status: { notIn: ['Done', 'Cancelled'] }, ...assignedWhere } }),
      this.prisma.visit.count({ where: { deletedAt: null, scheduledAt: { gte: startDate, lte: endDate }, ...baseWhere } }),
      this.prisma.visit.count({ where: { deletedAt: null, status: 'Completed', completedAt: { gte: startDate, lte: endDate }, ...baseWhere } }),
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { deletedAt: null, createdAt: { gte: startDate, lte: endDate }, status: { notIn: ['Cancelled', 'Returned'] }, ...baseWhere }
      }),
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { deletedAt: null, status: { notIn: ['Cancelled', 'Returned'] }, ...baseWhere }
      })
    ]);

    return {
      totalCustomers,
      activeCustomers,
      totalLeads,
      newLeadsThisMonth: newLeadsThisPeriod,
      convertedLeadsThisMonth: convertedLeadsThisPeriod,
      totalOrders,
      ordersThisMonth: ordersThisPeriod,
      totalSalesAmount: totalSalesAgg._sum.totalAmount || 0,
      salesThisMonth: salesThisPeriodAgg._sum.totalAmount || 0,
      pendingApprovalOrders,
      overdueTasks,
      todayVisits: visitsThisPeriod, // Mapped for UI compatibility
      completedVisitsThisMonth: completedVisitsThisPeriod,
    };
  }

  async getFunnel(user: any, startDate: Date, endDate: Date) {
    const oppWhere = user.role.name === 'SalesRep' ? { ownerId: user.id } : this.getBaseWhereClause(user);
    const spancopStages = ['Suspect', 'Prospect', 'Analysis', 'Negotiate', 'Close', 'Order', 'Payment'];
    
    // Count active opportunities (excluding Lost) in each SPANCOP stage
    const counts = await Promise.all(spancopStages.map(stage => 
      this.prisma.opportunity.count({
        where: { deletedAt: null, salesStage: stage, status: { not: 'Lost' }, createdAt: { gte: startDate, lte: endDate }, ...oppWhere }
      })
    ));

    return spancopStages.map((stage, i) => ({ stage, count: counts[i], name: stage, value: counts[i] }));
  }

  async getSalesAnalytics(user: any, startDate: Date, endDate: Date) {
    const baseWhere = this.getBaseWhereClause(user);
    
    const [brandGroups, agg] = await Promise.all([
      this.prisma.order.groupBy({
        by: ['brand'],
        _sum: { totalAmount: true },
        where: { deletedAt: null, createdAt: { gte: startDate, lte: endDate }, status: { notIn: ['Cancelled', 'Returned'] }, ...baseWhere }
      }),
      this.prisma.order.aggregate({
        _avg: { totalAmount: true },
        where: { deletedAt: null, createdAt: { gte: startDate, lte: endDate }, status: { notIn: ['Cancelled', 'Returned'] }, ...baseWhere }
      })
    ]);

    const salesByBrand = brandGroups.map(g => ({ brand: g.brand, amount: g._sum.totalAmount || 0 }));
    const averageOrderValue = agg._avg.totalAmount || 0;

    return {
      salesByBrand,
      salesByTerritory: [], // Complex without explicit territory joins in groupBy, skip for quick MVP or return empty
      salesBySalesRep: [], // Same
      averageOrderValue,
      topProducts: [] // Same
    };
  }

  async getFollowups(user: any, startDate: Date, endDate: Date) {
    const now = new Date();
    const assignedWhere = user.role.name === 'SalesRep' ? { assignedTo: user.id } : this.getBaseWhereClause(user);

    const [overdueTasks, tasksDueToday] = await Promise.all([
      this.prisma.task.count({ where: { deletedAt: null, dueAt: { lt: now }, status: { notIn: ['Done', 'Cancelled'] }, ...assignedWhere } }),
      this.prisma.task.count({ where: { deletedAt: null, dueAt: { gte: startDate, lte: endDate }, status: { notIn: ['Done', 'Cancelled'] }, ...assignedWhere } }),
    ]);

    return {
      overdueTasks,
      tasksDueToday,
      completedTasksThisMonth: 0, // Mock for MVP
      leadsWithoutActivity: 0,
      customersWithoutVisit: 0,
    };
  }

  async getInsights(user: any, startDate: Date, endDate: Date) {
    const now = new Date();
    
    const [allCustomersCount, leadsNeedingFollowup] = await Promise.all([
      this.prisma.customer.count({ where: { deletedAt: null } }),
      this.prisma.lead.count({
        where: { nextFollowUpAt: { lt: now, gte: startDate, lte: endDate }, status: { notIn: ['Converted', 'Lost'] } }
      })
    ]);
    
    return {
      customersAtRisk: Math.floor(allCustomersCount * 0.1), // Mock for MVP speed
      leadsNeedingFollowup,
      inactiveCustomers30Days: Math.floor(allCustomersCount * 0.2), // Mock
      inactiveCustomers60Days: Math.floor(allCustomersCount * 0.05), // Mock
    };
  }
}
