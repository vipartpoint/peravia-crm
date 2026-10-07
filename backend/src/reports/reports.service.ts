import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsService } from '../permissions/permissions.service';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsService
  ) {}

  private async checkPerm(userId: string, category: string, action: string) {
    const hasPerm = await this.permissions.checkPermission(userId, category, action);
    if (!hasPerm) throw new ForbiddenException(`Missing permission: ${category}.${action}`);
  }

  // 1. Sales Reports
  async getSalesReports(filters: any, user: any) {
    await this.checkPerm(user.id, 'Reports', 'View');
    
    let where: any = {};
    if (filters.startDate && filters.endDate) {
      where.createdAt = { gte: new Date(filters.startDate), lte: new Date(filters.endDate) };
    }
    if (filters.territoryId) where.territoryId = filters.territoryId;
    if (filters.userId) where.userId = filters.userId;

    const orders = await this.prisma.order.findMany({
      where,
      include: { customer: true, user: true, territory: true }
    });

    const summary = {
      totalOrders: orders.length,
      totalSales: orders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
      byStatus: this.groupBy(orders, 'status')
    };

    return { summary, data: orders };
  }

  // 2. Financial Reports
  async getFinancialReports(filters: any, user: any) {
    await this.checkPerm(user.id, 'FinancialReports', 'View');

    let chequeWhere: any = {};
    if (filters.startDate && filters.endDate) {
      chequeWhere.dueDate = { gte: new Date(filters.startDate), lte: new Date(filters.endDate) };
    }
    if (filters.customerId) chequeWhere.customerId = filters.customerId;

    const cheques = await this.prisma.cheque.findMany({
      where: chequeWhere,
      include: { customer: true }
    });

    const summary = {
      totalCheques: cheques.length,
      totalAmount: cheques.reduce((sum, c) => sum + Number(c.amount), 0),
      byStatus: this.groupBy(cheques, 'status')
    };

    return { summary, data: cheques };
  }

  // 3. CRM Reports
  async getCrmReports(filters: any, user: any) {
    await this.checkPerm(user.id, 'Reports', 'View');

    let where: any = {};
    if (filters.startDate && filters.endDate) {
      where.createdAt = { gte: new Date(filters.startDate), lte: new Date(filters.endDate) };
    }
    if (filters.userId) where.assignedTo = filters.userId;

    const leads = await this.prisma.lead.findMany({
      where,
      include: { assignedUser: { select: { username: true } } }
    });

    const summary = {
      totalLeads: leads.length,
      byStatus: this.groupBy(leads, 'status')
    };

    return { summary, data: leads };
  }

  // 4. Performance Reports
  async getPerformanceReports(filters: any, user: any) {
    await this.checkPerm(user.id, 'Reports', 'View');

    let where: any = {};
    if (filters.userId) where.userId = filters.userId;

    const kpis = await this.prisma.kPITarget.findMany({
      where,
      include: { user: { select: { username: true } } }
    });

    return { data: kpis };
  }

  // 5. Sales Intelligence & Advanced 13-KPI Analytics
  async getIntelligenceReports(filters: any, user: any) {
    await this.checkPerm(user.id, 'Reports', 'View');

    const now = new Date();
    const d30 = new Date(now.getTime() - 30 * 86400000);
    const d60 = new Date(now.getTime() - 60 * 86400000);
    const d90 = new Date(now.getTime() - 90 * 86400000);
    const d120 = new Date(now.getTime() - 120 * 86400000);
    const d180 = new Date(now.getTime() - 180 * 86400000);
    const d335 = new Date(now.getTime() - 335 * 86400000);
    const d365 = new Date(now.getTime() - 365 * 86400000);

    const baseWhere: any = {
      deletedAt: null,
      status: { notIn: ['Cancelled', 'Returned'] }
    };
    if (filters.territoryId) baseWhere.territoryId = filters.territoryId;
    if (filters.userId) baseWhere.userId = filters.userId;

    // Parallel fetch core datasets
    const [
      ordersCurrentMonth,
      ordersPrevMonth,
      ordersCurrentQuarter,
      ordersPrevQuarter,
      ordersLastYearSameMonth,
      allValidOrders,
      orderItemsRecent,
      orderItemsPrev,
      allCustomers,
      allLeads,
      salesReps,
      activeKpis,
      commissions,
      allTerritories
    ] = await Promise.all([
      // Current month orders (last 30 days)
      this.prisma.order.findMany({
        where: { ...baseWhere, createdAt: { gte: d30, lte: now } },
        select: { id: true, totalAmount: true, createdAt: true, customerId: true, territoryId: true, userId: true }
      }),
      // Previous month orders (30-60 days ago)
      this.prisma.order.findMany({
        where: { ...baseWhere, createdAt: { gte: d60, lt: d30 } },
        select: { id: true, totalAmount: true }
      }),
      // Current quarter orders (last 90 days)
      this.prisma.order.findMany({
        where: { ...baseWhere, createdAt: { gte: d90, lte: now } },
        select: { id: true, totalAmount: true }
      }),
      // Previous quarter orders (90-180 days ago)
      this.prisma.order.findMany({
        where: { ...baseWhere, createdAt: { gte: d180, lt: d90 } },
        select: { id: true, totalAmount: true }
      }),
      // Last year same month orders (335-365 days ago)
      this.prisma.order.findMany({
        where: { ...baseWhere, createdAt: { gte: d365, lte: d335 } },
        select: { id: true, totalAmount: true }
      }),
      // All orders for customer repeat cycle and top customer aggregation
      this.prisma.order.findMany({
        where: baseWhere,
        include: {
          customer: { select: { id: true, name: true, phone: true, territoryId: true } },
          territory: { select: { id: true, name: true, type: true } }
        },
        orderBy: { createdAt: 'asc' }
      }),
      // Recent order items (last 60 days) for product rankings and demand trends
      this.prisma.orderItem.findMany({
        where: {
          order: { ...baseWhere, createdAt: { gte: d60, lte: now } }
        },
        include: { product: true }
      }),
      // Previous order items (60-120 days ago) for product demand delta comparison
      this.prisma.orderItem.findMany({
        where: {
          order: { ...baseWhere, createdAt: { gte: d120, lt: d60 } }
        },
        include: { product: true }
      }),
      // Customers
      this.prisma.customer.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true, status: true, churnStatus: true, loyaltyTier: true, createdAt: true, territory: { select: { name: true, type: true } } }
      }),
      // Leads
      this.prisma.lead.findMany({
        where: { deletedAt: null },
        select: { id: true, status: true, source: true, createdAt: true }
      }),
      // Sales reps
      this.prisma.user.findMany({
        where: { deletedAt: null, role: { name: 'SalesRep' } },
        select: { id: true, username: true, email: true, territory: { select: { name: true } } }
      }),
      // KPIs
      this.prisma.kPITarget.findMany({
        where: { deletedAt: null, status: 'ACTIVE' },
        include: { user: { select: { username: true } }, territory: { select: { name: true } } }
      }),
      // Commissions
      this.prisma.commission.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { user: { select: { username: true } } }
      }),
      // Territories
      this.prisma.territory.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true, type: true }
      })
    ]);

    // 1. Monthly Sales Calculation
    const currentMonthSales = ordersCurrentMonth.reduce((acc, o) => acc + Number(o.totalAmount), 0);
    const prevMonthSales = ordersPrevMonth.reduce((acc, o) => acc + Number(o.totalAmount), 0);
    const monthlyGrowthPercent = prevMonthSales > 0 ? Math.round(((currentMonthSales - prevMonthSales) / prevMonthSales) * 100) : (currentMonthSales > 0 ? 100 : 0);

    // 2. Top-Selling Products (by Revenue and Quantity)
    const productStatsMap = new Map<string, { product: any; totalQty: number; totalRevenue: number }>();
    for (const item of orderItemsRecent) {
      if (!item.product) continue;
      const existing = productStatsMap.get(item.productId) || {
        product: { id: item.product.id, name: item.product.name, sku: item.product.sku, brand: item.product.brand },
        totalQty: 0,
        totalRevenue: 0
      };
      existing.totalQty += item.quantity;
      existing.totalRevenue += Number(item.totalPrice);
      productStatsMap.set(item.productId, existing);
    }
    const topProducts = Array.from(productStatsMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    // 3. Top Customers & Top Provinces/Cities
    const customerStatsMap = new Map<string, { customerId: string; name: string; territoryName: string; totalSpent: number; orderCount: number; lastOrderDate: Date }>();
    const territoryStatsMap = new Map<string, { territoryId: string; name: string; type: string; totalSales: number; orderCount: number }>();

    for (const order of allValidOrders) {
      // Customer aggregation
      if (order.customer) {
        const cStat = customerStatsMap.get(order.customerId) || {
          customerId: order.customerId,
          name: order.customer.name,
          territoryName: order.territory?.name || 'نامشخص',
          totalSpent: 0,
          orderCount: 0,
          lastOrderDate: order.createdAt
        };
        cStat.totalSpent += Number(order.totalAmount);
        cStat.orderCount += 1;
        if (new Date(order.createdAt) > new Date(cStat.lastOrderDate)) {
          cStat.lastOrderDate = order.createdAt;
        }
        customerStatsMap.set(order.customerId, cStat);
      }

      // Territory aggregation
      if (order.territoryId && order.territory) {
        const tStat = territoryStatsMap.get(order.territoryId) || {
          territoryId: order.territoryId,
          name: order.territory.name,
          type: order.territory.type || 'منطقه',
          totalSales: 0,
          orderCount: 0
        };
        tStat.totalSales += Number(order.totalAmount);
        tStat.orderCount += 1;
        territoryStatsMap.set(order.territoryId, tStat);
      }
    }

    const topCustomers = Array.from(customerStatsMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    const topTerritories = Array.from(territoryStatsMap.values())
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 10);

    // 4. Quarter-over-Quarter (Q-o-Q) Sales Comparison
    const currentQuarterSales = ordersCurrentQuarter.reduce((acc, o) => acc + Number(o.totalAmount), 0);
    const prevQuarterSales = ordersPrevQuarter.reduce((acc, o) => acc + Number(o.totalAmount), 0);
    const quarterGrowthPercent = prevQuarterSales > 0 ? Math.round(((currentQuarterSales - prevQuarterSales) / prevQuarterSales) * 100) : (currentQuarterSales > 0 ? 100 : 0);

    // 5 & 6. Product Demand Trend (Declining and Increasing Demand)
    const prevProductQtyMap = new Map<string, number>();
    for (const item of orderItemsPrev) {
      prevProductQtyMap.set(item.productId, (prevProductQtyMap.get(item.productId) || 0) + item.quantity);
    }

    const allProductIds = new Set([...productStatsMap.keys(), ...prevProductQtyMap.keys()]);
    const demandTrendList: any[] = [];

    for (const prodId of allProductIds) {
      const recent = productStatsMap.get(prodId);
      const currQty = recent?.totalQty || 0;
      const prevQty = prevProductQtyMap.get(prodId) || 0;
      const deltaQty = currQty - prevQty;
      const growthRate = prevQty > 0 ? Math.round(((currQty - prevQty) / prevQty) * 100) : (currQty > 0 ? 100 : 0);
      const name = recent?.product?.name || `کالای #${prodId.slice(0, 6)}`;
      const brand = recent?.product?.brand || '-';

      demandTrendList.push({
        productId: prodId,
        name,
        brand,
        currQty,
        prevQty,
        deltaQty,
        growthRate
      });
    }

    const increasingDemand = demandTrendList
      .filter(p => p.deltaQty > 0)
      .sort((a, b) => b.deltaQty - a.deltaQty)
      .slice(0, 10);

    const decliningDemand = demandTrendList
      .filter(p => p.deltaQty < 0)
      .sort((a, b) => a.deltaQty - b.deltaQty)
      .slice(0, 10);

    // 7. Year-over-Year (YoY) Same-Month Sales Comparison
    const lastYearSameMonthSales = ordersLastYearSameMonth.reduce((acc, o) => acc + Number(o.totalAmount), 0);
    const yoyGrowthPercent = lastYearSameMonthSales > 0 ? Math.round(((currentMonthSales - lastYearSameMonthSales) / lastYearSameMonthSales) * 100) : (currentMonthSales > 0 ? 100 : 0);

    // 8. Customer Reorder Prediction (میانگین زمان احتمالی خرید هر مشتری)
    const customerOrdersMap = new Map<string, Date[]>();
    for (const order of allValidOrders) {
      const dates = customerOrdersMap.get(order.customerId) || [];
      dates.push(new Date(order.createdAt));
      customerOrdersMap.set(order.customerId, dates);
    }

    const reorderPredictionList: any[] = [];
    let totalIntervalsSum = 0;
    let totalIntervalsCount = 0;

    for (const [cId, dates] of customerOrdersMap.entries()) {
      if (dates.length < 2) continue; // Need at least 2 orders to calculate cycle
      dates.sort((a, b) => a.getTime() - b.getTime());

      let intervalSum = 0;
      for (let i = 1; i < dates.length; i++) {
        const diffDays = Math.max(1, Math.round((dates[i].getTime() - dates[i - 1].getTime()) / 86400000));
        intervalSum += diffDays;
      }
      const avgIntervalDays = Math.round(intervalSum / (dates.length - 1));
      totalIntervalsSum += avgIntervalDays;
      totalIntervalsCount += 1;

      const lastDate = dates[dates.length - 1];
      const daysSinceLastOrder = Math.max(0, Math.round((now.getTime() - lastDate.getTime()) / 86400000));
      const daysUntilNextOrder = avgIntervalDays - daysSinceLastOrder;
      const predictedNextDate = new Date(lastDate.getTime() + avgIntervalDays * 86400000);

      let status = 'NORMAL';
      let statusLabel = 'چرخه عادی';
      if (daysSinceLastOrder > avgIntervalDays + 10) {
        status = 'OVERDUE';
        statusLabel = 'تاخیر در خرید (هشدار)';
      } else if (daysUntilNextOrder <= 7 && daysUntilNextOrder >= -10) {
        status = 'DUE_SOON';
        statusLabel = 'در آستانه سفارش مجدد';
      }

      const cInfo = customerStatsMap.get(cId);

      reorderPredictionList.push({
        customerId: cId,
        customerName: cInfo?.name || 'مشتری',
        orderCount: dates.length,
        avgIntervalDays,
        lastOrderDate: lastDate,
        daysSinceLastOrder,
        daysUntilNextOrder,
        predictedNextDate,
        status,
        statusLabel
      });
    }

    const globalAvgReorderDays = totalIntervalsCount > 0 ? Math.round(totalIntervalsSum / totalIntervalsCount) : 0;
    const sortedReorderPredictions = reorderPredictionList
      .sort((a, b) => (b.daysSinceLastOrder - b.avgIntervalDays) - (a.daysSinceLastOrder - a.avgIntervalDays))
      .slice(0, 15);

    // 9 & 10. Churn Rate & Customer Retention
    const totalCustomers = allCustomers.length;
    // Churned: status Red/Orange or inactive with no orders in last 90 days
    const activeCustomerIds = new Set(allValidOrders.filter(o => new Date(o.createdAt) >= d90).map(o => o.customerId));
    const churnedCount = allCustomers.filter(c => c.churnStatus === 'Red' || c.churnStatus === 'Orange' || (!activeCustomerIds.has(c.id) && new Date(c.createdAt) < d90)).length;
    const churnRate = totalCustomers > 0 ? Math.round((churnedCount / totalCustomers) * 100) : 0;
    const retentionRate = Math.max(0, 100 - churnRate);
    const repeatCustomerCount = reorderPredictionList.length;
    const repeatPurchaseRate = totalCustomers > 0 ? Math.round((repeatCustomerCount / totalCustomers) * 100) : 0;

    // 11. Lead to Customer Conversion Rate
    const totalLeads = allLeads.length;
    const convertedLeads = allLeads.filter(l => l.status === 'Converted').length;
    const lostLeads = allLeads.filter(l => l.status === 'Lost').length;
    const activeLeads = totalLeads - convertedLeads - lostLeads;
    const leadConversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

    // 12. Sales Reps Performance Evaluation
    const repPerformanceList = salesReps.map(rep => {
      const repOrders = allValidOrders.filter(o => o.userId === rep.id);
      const repSales = repOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
      const repKpi = activeKpis.find(k => k.userId === rep.id);
      return {
        id: rep.id,
        username: rep.username,
        territory: rep.territory?.name || 'عمومی',
        ordersCount: repOrders.length,
        totalSales: repSales,
        kpiScore: repKpi ? Number(repKpi.totalWeightedScore || 0).toFixed(1) : '۰',
        salesAchievementPercent: repKpi ? Math.round(Number(repKpi.salesAchievementPercent || 0)) : 0
      };
    }).sort((a, b) => b.totalSales - a.totalSales);

    // 13. Commission Summary
    const totalCommissionsAmount = commissions.reduce((sum, c) => sum + Number(c.commissionAmount), 0);
    const approvedCommissionsAmount = commissions.filter(c => c.status === 'Approved' || c.status === 'Paid').reduce((sum, c) => sum + Number(c.commissionAmount), 0);
    const pendingCommissionsCount = commissions.filter(c => c.status === 'Draft' || c.status === 'Pending').length;

    return {
      // 1. Monthly Sales
      monthlySales: {
        currentMonthSales,
        prevMonthSales,
        ordersCount: ordersCurrentMonth.length,
        growthPercent: monthlyGrowthPercent
      },
      // 2. Top-Selling Products
      topProducts,
      // 3. Top Customers and Territories
      topCustomers,
      topTerritories,
      // 4. Quarter Comparison (Q-o-Q)
      quarterComparison: {
        currentQuarterSales,
        prevQuarterSales,
        currentQuarterOrders: ordersCurrentQuarter.length,
        prevQuarterOrders: ordersPrevQuarter.length,
        growthPercent: quarterGrowthPercent
      },
      // 5 & 6. Demand Trends
      increasingDemand,
      decliningDemand,
      // 7. Year-over-Year (YoY)
      yoyComparison: {
        currentMonthSales,
        lastYearSameMonthSales,
        growthPercent: yoyGrowthPercent
      },
      // 8. Customer Reorder Prediction
      customerReorderPrediction: {
        globalAvgReorderDays,
        predictions: sortedReorderPredictions
      },
      // 9 & 10. Churn & Retention
      churnAndRetention: {
        totalCustomers,
        churnedCount,
        churnRate,
        retentionRate,
        repeatCustomerCount,
        repeatPurchaseRate
      },
      // 11. Lead Conversion
      leadConversion: {
        totalLeads,
        convertedLeads,
        lostLeads,
        activeLeads,
        conversionRate: leadConversionRate
      },
      // 12. Sales Reps Performance
      salesRepsPerformance: repPerformanceList,
      // 13. Commission Summary
      commissionsSummary: {
        totalAmount: totalCommissionsAmount,
        approvedAmount: approvedCommissionsAmount,
        pendingCount: pendingCommissionsCount,
        recent: commissions.slice(0, 5)
      }
    };
  }

  // Helper
  private groupBy(array: any[], key: string) {
    return array.reduce((result, currentValue) => {
      (result[currentValue[key]] = result[currentValue[key]] || []).push(currentValue);
      return result;
    }, {});
  }
}

