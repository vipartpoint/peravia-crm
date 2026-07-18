import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ReceivablesService } from '../receivables/receivables.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class FinancialAlertsService {
  private readonly logger = new Logger(FinancialAlertsService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private receivablesService: ReceivablesService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkAllAlerts() {
    this.logger.log('Running daily financial alerts check...');
    await this.checkDueCheques();
    await this.checkOverdueCheques();
    await this.checkBouncedCheques();
    await this.checkCreditLimits();
    await this.checkOverdueUnpaidOrders();
  }

  private async getFinanceUsers() {
    return this.prisma.user.findMany({
      where: { role: { name: { in: ['Finance', 'CEO', 'SystemAdmin', 'SalesManager'] } }, deletedAt: null }
    });
  }

  private notifyFinance(users: any[], payload: any) {
    return Promise.all(users.map(u => this.notificationsService.sendNotification({
      ...payload,
      userId: u.id,
      fingerprint: payload.fingerprint ? `${u.id}_${payload.fingerprint}` : undefined
    })));
  }

  async checkDueCheques() {
    const now = new Date();
    const in3Days = new Date(now.getTime() + 3 * 24 * 3600 * 1000);
    
    const cheques = await this.prisma.cheque.findMany({
      where: { status: { in: ['Registered', 'NearDue'] }, dueDate: { lte: in3Days, gte: now }, deletedAt: null },
      include: { customer: true }
    });

    const financeUsers = await this.getFinanceUsers();

    for (const cheque of cheques) {
      if (cheque.status === 'Registered') {
        await this.prisma.cheque.update({ where: { id: cheque.id }, data: { status: 'NearDue' } });
      }

      await this.notifyFinance(financeUsers, {
        title: 'چک نزدیک به موعد',
        message: `چک مشتری ${cheque.customer.name} به مبلغ ${Number(cheque.amount).toLocaleString()} فردا یا روزهای آینده سررسید می‌شود.`,
        type: 'Alert',
        priority: 'Warning',
        relatedType: 'Cheque',
        relatedId: cheque.id,
        fingerprint: `CHEQUE_DUE_${cheque.id}`
      });
    }
  }

  async checkOverdueCheques() {
    const now = new Date();
    const cheques = await this.prisma.cheque.findMany({
      where: { status: { notIn: ['Cleared', 'Bounced', 'Cancelled'] }, dueDate: { lt: now }, deletedAt: null },
      include: { customer: true }
    });

    const financeUsers = await this.getFinanceUsers();

    for (const cheque of cheques) {
      await this.notifyFinance(financeUsers, {
        title: 'چک سررسید گذشته',
        message: `چک مشتری ${cheque.customer.name} از موعد عبور کرده و وضعیت آن نامشخص است.`,
        type: 'Alert',
        priority: 'Critical',
        relatedType: 'Cheque',
        relatedId: cheque.id,
        fingerprint: `CHEQUE_OVERDUE_${cheque.id}`
      });
    }
  }

  async checkBouncedCheques() {
    const cheques = await this.prisma.cheque.findMany({
      where: { status: 'Bounced', deletedAt: null },
      include: { customer: true }
    });

    const financeUsers = await this.getFinanceUsers();

    for (const cheque of cheques) {
      await this.notifyFinance(financeUsers, {
        title: 'چک برگشتی',
        message: `چک مشتری ${cheque.customer.name} برگشت خورده است! لطفا بررسی کنید.`,
        type: 'Alert',
        priority: 'Critical',
        relatedType: 'Cheque',
        relatedId: cheque.id,
        fingerprint: `CHEQUE_BOUNCED_${cheque.id}`
      });
    }
  }

  async checkCreditLimits() {
    const customers = await this.prisma.customer.findMany({ where: { deletedAt: null } });
    const financeUsers = await this.getFinanceUsers();

    for (const c of customers) {
      const fin = await this.receivablesService.getCustomerRiskAndCredit(c.id);
      if (!fin) continue;

      if (fin.riskStatus === 'HighRisk' || fin.riskStatus === 'Blocked') {
        await this.notifyFinance(financeUsers, {
          title: 'مشتری پرخطر مالی',
          message: `مشتری ${c.name} در وضعیت پرخطر قرار دارد (میزان بدهی: ${fin.totalUnpaidAmount.toLocaleString()}).`,
          type: 'Alert',
          priority: 'Critical',
          relatedType: 'Customer',
          relatedId: c.id,
          fingerprint: `CUSTOMER_RISK_${c.id}_${fin.riskStatus}`
        });
      }

      if (fin.remainingCredit <= 0) {
        await this.notifyFinance(financeUsers, {
          title: 'عبور از سقف اعتبار',
          message: `مشتری ${c.name} از سقف اعتباری خود عبور کرده است.`,
          type: 'Alert',
          priority: 'Warning',
          relatedType: 'Customer',
          relatedId: c.id,
          fingerprint: `CUSTOMER_CREDIT_EXCEEDED_${c.id}`
        });
      }
    }
  }

  async checkOverdueUnpaidOrders() {
    const orders = await this.prisma.order.findMany({
      where: { status: 'Delivered', uncollectedAmount: { gt: 0 }, deletedAt: null },
      include: { customer: true }
    });

    const financeUsers = await this.getFinanceUsers();

    for (const order of orders) {
      await this.notifyFinance(financeUsers, {
        title: 'سفارش تسویه‌نشده',
        message: `سفارش تحویل‌شده برای ${order.customer.name} هنوز مبلغ ${Number(order.uncollectedAmount).toLocaleString()} بدهی دارد.`,
        type: 'Alert',
        priority: 'Warning',
        relatedType: 'Order',
        relatedId: order.id,
        fingerprint: `ORDER_UNPAID_${order.id}`
      });
    }
  }
}
