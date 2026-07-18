import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService
  ) {}

  private async logExecution(jobName: string, execute: () => Promise<number>) {
    const log = await this.prisma.automationExecutionLog.create({
      data: { jobName, status: 'Running' }
    });
    try {
      const processedCount = await execute();
      await this.prisma.automationExecutionLog.update({
        where: { id: log.id },
        data: { status: 'Success', finishedAt: new Date(), processedCount }
      });
    } catch (error: any) {
      this.logger.error(`Failed to execute ${jobName}`, error.stack);
      await this.prisma.automationExecutionLog.update({
        where: { id: log.id },
        data: { status: 'Failed', finishedAt: new Date(), errorMessage: error.message }
      });
    }
  }

  // ---------------------------------------------------------
  // Hourly Jobs (Overdue tasks, Due followups, Escalation)
  // ---------------------------------------------------------
  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlyTasks() {
    this.logger.log('Running Hourly Tasks...');
    await this.logExecution('HourlyTasks', async () => {
      let count = 0;
      const now = new Date();
      
      const overdueTasks = await this.prisma.task.findMany({
        where: { status: { in: ['Open', 'InProgress'] }, dueAt: { lt: now } },
        include: { assignee: { include: { territory: true } } }
      });

      for (const task of overdueTasks) {
        if (!task.dueAt) continue;
        const diffDays = Math.floor((now.getTime() - task.dueAt.getTime()) / (1000 * 60 * 60 * 24));
        
        let targetUserId = task.assignee.id;
        let priority: 'Warning' | 'Critical' = 'Warning';
        
        if (diffDays >= 7) {
          // Escalation: Sales Manager
          const salesManager = await this.prisma.user.findFirst({ where: { role: { name: 'SalesManager' } } });
          if (salesManager) {
            targetUserId = salesManager.id;
            priority = 'Critical';
          }
        } else if (diffDays >= 3) {
          // Escalation: Direct Manager or Regional Manager
          if (task.assignee.territory?.managerId) {
            targetUserId = task.assignee.territory.managerId;
            priority = 'Warning';
          }
        }

        const fingerprint = `task-overdue-${task.id}-day-${diffDays}`;

        const notif = await this.notifications.sendNotification({
          userId: targetUserId,
          title: `تسک عقب‌افتاده: ${task.title}`,
          message: `این تسک ${diffDays} روز از موعد آن گذشته است.`,
          type: diffDays >= 3 ? 'Escalation' : 'Reminder',
          priority,
          entityType: 'Task',
          entityId: task.id,
          actionUrl: '/tasks',
          fingerprint,
        });
        if (notif) count++;
      }

      return count;
    });
  }

  // ---------------------------------------------------------
  // Morning Jobs (Today's visits, Today's tasks)
  // ---------------------------------------------------------
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async handleMorningAlerts() {
    this.logger.log('Running Morning Alerts...');
    await this.logExecution('MorningAlerts', async () => {
      let count = 0;
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      // Today's Visits
      const todayVisits = await this.prisma.visit.findMany({
        where: { scheduledAt: { gte: startOfDay, lte: endOfDay }, status: 'Planned' },
        include: { customer: true }
      });

      for (const visit of todayVisits) {
        const notif = await this.notifications.sendNotification({
          userId: visit.userId,
          title: 'برنامه ویزیت امروز',
          message: `شما امروز یک ویزیت با ${visit.customer?.name || 'مشتری'} دارید.`,
          type: 'Reminder',
          priority: 'Info',
          entityType: 'Visit',
          entityId: visit.id,
          actionUrl: '/territories', // or visits page
          fingerprint: `visit-today-${visit.id}`,
        });
        if (notif) count++;
      }

      return count;
    });
  }

  // ---------------------------------------------------------
  // Nightly Jobs (Inventory, Cheques, Churn Risk)
  // ---------------------------------------------------------
  @Cron(CronExpression.EVERY_DAY_AT_11PM)
  async handleNightlyAlerts() {
    this.logger.log('Running Nightly Alerts...');
    await this.logExecution('NightlyAlerts', async () => {
      let count = 0;
      
      const salesManagers = await this.prisma.user.findMany({ where: { role: { name: { in: ['SalesManager', 'WarehouseManager', 'CEO'] } } } });

      // 1. Low Stock
      const lowStocks = await this.prisma.inventoryStock.findMany({
        where: { availableQuantity: { lte: this.prisma.inventoryStock.fields.minStockLevel } },
        include: { product: true, warehouse: true }
      });

      for (const stock of lowStocks) {
        const isOut = Number(stock.availableQuantity) <= 0;
        const fingerprint = `low-stock-${stock.id}-${isOut ? 'out' : 'low'}`;

        for (const manager of salesManagers) {
          const notif = await this.notifications.sendNotification({
            userId: manager.id,
            title: isOut ? 'اتمام موجودی کالا' : 'هشدار کاهش موجودی',
            message: `کالای ${stock.product.name} در انبار ${stock.warehouse?.name} ${isOut ? 'ناموجود شد' : 'به زیر حد نصاب رسید'}.`,
            type: 'System',
            priority: isOut ? 'Critical' : 'Warning',
            entityType: 'Inventory',
            entityId: stock.id,
            actionUrl: '/inventory/alerts',
            fingerprint,
          });
          if (notif) count++;
        }
      }

      // 2. Bounced Cheques (Notify Finance and assigned rep)
      const bouncedCheques = await this.prisma.cheque.findMany({
        where: { status: 'Bounced' },
        include: { customer: { include: { assignee: true } } }
      });

      const finances = await this.prisma.user.findMany({ where: { role: { name: 'Finance' } } });

      for (const cheque of bouncedCheques) {
        const fingerprint = `cheque-bounced-${cheque.id}`;
        
        const targets = [...finances];
        if (cheque.customer.assignee) targets.push(cheque.customer.assignee);

        for (const user of targets) {
          const notif = await this.notifications.sendNotification({
            userId: user.id,
            title: 'هشدار چک برگشتی',
            message: `چک مشتری ${cheque.customer.name} برگشت خورده است.`,
            type: 'Alert',
            priority: 'Critical',
            entityType: 'Cheque',
            entityId: cheque.id,
            actionUrl: '/cheques',
            fingerprint,
          });
          if (notif) count++;
        }
      }

      return count;
    });
  }
}
