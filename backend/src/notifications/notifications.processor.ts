import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SmsProviderRegistryService } from './sms-provider-registry.service';

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly smsRegistry: SmsProviderRegistryService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.debug(`Processing job ${job.id} of type ${job.name}`);
    const { logId, channel, recipient, message } = job.data;

    try {
      // Mark as Queued/Processing
      await this.prisma.notificationLog.update({
        where: { id: logId },
        data: { status: 'Queued' }
      });

      let providerId = null;
      let usedProvider = null;

      if (channel === 'SMS') {
        const smsProvider = await this.smsRegistry.getActiveProvider();
        usedProvider = smsProvider.constructor.name.replace('Provider', '').toLowerCase();
        providerId = await smsProvider.send(recipient, message);
      } else {
        // Implement EMAIL or IN_APP later
        this.logger.warn(`Unsupported channel: ${channel}`);
        throw new Error(`Unsupported channel: ${channel}`);
      }

      await this.prisma.notificationLog.update({
        where: { id: logId },
        data: {
          status: 'Sent', // Will be updated to Delivered later via status check
          provider: usedProvider,
          providerMessageId: providerId,
          sentAt: new Date()
        }
      });

      await this.prisma.auditLog.create({
        data: {
          action: 'SMS_SENT',
          entityType: 'NotificationLog',
          entityId: logId,
          newValue: { channel, recipient, provider: usedProvider }
        }
      });

      this.logger.debug(`Job ${job.id} completed successfully`);
      return { success: true, providerId };
    } catch (error: any) {
      this.logger.error(`Job ${job.id} failed: ${error.message}`);
      
      // If it's the last attempt, mark it as Failed permanently
      if (job.attemptsMade >= (job.opts.attempts || 3)) {
        await this.prisma.notificationLog.update({
          where: { id: logId },
          data: {
            status: 'Failed',
            errorMessage: error.message
          }
        });

        await this.prisma.auditLog.create({
          data: {
            action: 'SMS_FAILED',
            entityType: 'NotificationLog',
            entityId: logId,
            newValue: { error: error.message, attempts: job.attemptsMade }
          }
        });
      }
      throw error;
    }
  }
}
