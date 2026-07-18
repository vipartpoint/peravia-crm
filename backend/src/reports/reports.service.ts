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

  // Helper
  private groupBy(array: any[], key: string) {
    return array.reduce((result, currentValue) => {
      (result[currentValue[key]] = result[currentValue[key]] || []).push(currentValue);
      return result;
    }, {});
  }
}
