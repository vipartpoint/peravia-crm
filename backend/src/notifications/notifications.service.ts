import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EncryptionUtil } from '../utils/encryption.util';
import { SmsProviderRegistryService } from './sms-provider-registry.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('notifications') private notificationQueue: Queue,
    private readonly smsRegistry: SmsProviderRegistryService
  ) {}

  /**
   * Abstraction layer for sending notifications.
   * Ready for WebSocket integration later.
   */
  async sendNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: string;
    priority: 'Low' | 'Medium' | 'High' | 'Critical' | 'Info' | 'Success' | 'Warning';
    entityType?: string;
    entityId?: string;
    actionUrl?: string;
    fingerprint?: string;
    metadata?: any;
  }) {
    // Check preferences
    const prefs = await this.getPreferences(data.userId);
    if (!prefs.inAppEnabled) return null;

    if (data.type === 'Alert' && data.entityType === 'Inventory' && !prefs.inventoryAlerts) return null;
    if (data.type === 'Alert' && (data.entityType === 'Cheque' || data.entityType === 'Payment') && !prefs.financialAlerts) return null;
    if ((data.type === 'Alert' || data.type === 'Reminder') && (data.entityType === 'Task' || data.entityType === 'Visit' || data.entityType === 'Order') && !prefs.crmAlerts) return null;
    if (data.type === 'Alert' && data.entityType === 'Customer' && data.title.includes('هوش مصنوعی') && !prefs.aiAlerts) return null;
    // Security alerts cannot be disabled

    // Deduplication check
    if (data.fingerprint) {
      const existing = await this.prisma.notification.findUnique({
        where: { fingerprint: data.fingerprint }
      });

      if (existing) {
        if (existing.status === 'Unread') {
          // Already active and unread, just bump the updatedAt
          return this.prisma.notification.update({
            where: { id: existing.id },
            data: { updatedAt: new Date() } // bump timestamp
          });
        } else {
          // It was read, so maybe the condition occurred again. We reset it to unread.
          return this.prisma.notification.update({
            where: { id: existing.id },
            data: { status: 'Unread', updatedAt: new Date() }
          });
        }
      }
    }

    const notification = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        priority: data.priority,
        entityType: data.entityType,
        entityId: data.entityId,
        actionUrl: data.actionUrl,
        fingerprint: data.fingerprint,
        metadata: data.metadata || {}
      }
    });

    // TODO: Emit WebSocket event here
    // this.eventEmitter.emit('notification.created', notification);

    return notification;
  }

  async findAll(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: [
        { priority: 'asc' }, // We need to sort Critical first. In Prisma string sorting, 'Critical' < 'Info'. We should probably map it manually or just order by createdAt.
        { createdAt: 'desc' }
      ],
      take: 50
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, status: 'Unread' }
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { status: 'Read', readAt: new Date() }
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, status: 'Unread' },
      data: { status: 'Read', readAt: new Date() }
    });
  }

  async getPreferences(userId: string) {
    let prefs = await this.prisma.notificationPreference.findUnique({
      where: { userId }
    });

    if (!prefs) {
      prefs = await this.prisma.notificationPreference.create({
        data: { userId }
      });
    }
    return prefs;
  }

  async updatePreferences(userId: string, data: any) {
    return this.prisma.notificationPreference.update({
      where: { userId },
      data: {
        inAppEnabled: data.inAppEnabled,
        inventoryAlerts: data.inventoryAlerts,
        financialAlerts: data.financialAlerts,
        crmAlerts: data.crmAlerts,
        aiAlerts: data.aiAlerts,
        smsEnabled: data.smsEnabled,
        emailEnabled: data.emailEnabled,
      }
    });
  }

  /**
   * Universal notification dispatcher that handles template rendering and queuing.
   */
  async dispatch(options: {
    templateCode: string;
    recipient: string; // phone number or email depending on channel
    variables?: Record<string, string>;
    relatedEntityType?: string;
    relatedEntityId?: string;
    overrideChannel?: string;
  }) {
    try {
      const template = await this.prisma.notificationTemplate.findUnique({
        where: { code: options.templateCode }
      });

      if (!template || !template.isActive) {
        this.logger.warn(`Template ${options.templateCode} is not active or not found.`);
        return null;
      }

      const channel = options.overrideChannel || template.channel;
      let messageContent = template.content;
      let maskedMessageContent = template.content;
      
      const sensitiveKeys = ['code', 'otp', 'token', 'password'];

      if (options.variables) {
        for (const [key, val] of Object.entries(options.variables)) {
          // Replace in unmasked version (for sending)
          messageContent = messageContent.replace(new RegExp(`{${key}}`, 'g'), val);
          
          // Replace in masked version (for DB log)
          const isSensitive = sensitiveKeys.some(sk => key.toLowerCase().includes(sk));
          const displayVal = isSensitive ? '******' : val;
          maskedMessageContent = maskedMessageContent.replace(new RegExp(`{${key}}`, 'g'), displayVal);
        }
      }

      // Create log entry in Pending state
      const log = await this.prisma.notificationLog.create({
        data: {
          type: template.code,
          category: template.category,
          channel: channel,
          recipient: options.recipient,
          message: maskedMessageContent,
          status: 'Pending',
          relatedEntityType: options.relatedEntityType,
          relatedEntityId: options.relatedEntityId,
        }
      });

      // Enqueue job
      await this.notificationQueue.add('send-notification', {
        logId: log.id,
        channel,
        recipient: options.recipient,
        message: messageContent
      });

      return log;
    } catch (error: any) {
      this.logger.error(`Failed to dispatch notification: ${error.message}`);
      throw error;
    }
  }

  // --- Admin Methods ---

  async getTemplates() {
    return this.prisma.notificationTemplate.findMany({
      orderBy: { category: 'asc' }
    });
  }

  async updateTemplate(id: string, data: any) {
    const updated = await this.prisma.notificationTemplate.update({
      where: { id },
      data: {
        content: data.content,
        isActive: data.isActive
      }
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'SMS_TEMPLATE_UPDATED',
        entityType: 'NotificationTemplate',
        entityId: id,
        newValue: { content: data.content, isActive: data.isActive }
      }
    });

    return updated;
  }

  async getLogs(query: any) {
    const { category, provider, status, dateFrom, dateTo } = query;
    const where: any = {};
    
    if (category) where.category = category;
    if (provider) where.provider = provider;
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    return this.prisma.notificationLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100
    });
  }

  async testSms(recipient: string) {
    // A test SMS avoids the template engine but uses the dispatcher logic with a special template
    // Or we just queue a raw message directly:
    const log = await this.prisma.notificationLog.create({
      data: {
        type: 'TEST_SMS',
        category: 'System',
        channel: 'SMS',
        recipient,
        message: 'This is a test SMS from CRM Notification Engine.',
        status: 'Pending',
      }
    });

    await this.notificationQueue.add('send-notification', {
      logId: log.id,
      channel: 'SMS',
      recipient,
      message: 'This is a test SMS from CRM Notification Engine.'
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'TEST_SMS_SENT',
        entityType: 'NotificationLog',
        entityId: log.id,
        newValue: { recipient }
      }
    });

    return { message: 'Test SMS queued successfully', logId: log.id };
  }

  // --- SMS Provider Management ---

  async getSmsProviders() {
    const providers = await this.prisma.smsProviderConfig.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    // Mask sensitive data before returning to frontend
    return providers.map(p => ({
      ...p,
      encryptedApiKey: p.encryptedApiKey ? '********' : null,
      encryptedUsername: p.encryptedUsername ? '********' : null,
      encryptedPassword: p.encryptedPassword ? '********' : null,
      customHeadersEncrypted: p.customHeadersEncrypted ? '********' : null,
    }));
  }

  async createSmsProvider(userId: string, data: any) {
    const provider = await this.prisma.smsProviderConfig.create({
      data: {
        name: data.name,
        providerType: data.providerType,
        status: data.status || 'Active',
        senderNumber: data.senderNumber,
        baseUrl: data.baseUrl,
        encryptedApiKey: data.apiKey ? EncryptionUtil.encrypt(data.apiKey) : null,
        encryptedUsername: data.username ? EncryptionUtil.encrypt(data.username) : null,
        encryptedPassword: data.password ? EncryptionUtil.encrypt(data.password) : null,
        customHeadersEncrypted: data.customHeaders ? EncryptionUtil.encrypt(JSON.stringify(data.customHeaders)) : null,
        customPayloadTemplate: data.customPayloadTemplate,
        isDefault: false, // Default must be set via explicit action
        createdBy: userId
      }
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'SMS_PROVIDER_CREATED',
        entityType: 'SmsProviderConfig',
        entityId: provider.id,
        newValue: { name: provider.name, type: provider.providerType }
      }
    });

    return { message: 'Provider created', id: provider.id };
  }

  async updateSmsProvider(id: string, userId: string, data: any) {
    const current = await this.prisma.smsProviderConfig.findUnique({ where: { id } });
    if (!current) throw new Error('Provider not found');

    const updateData: any = {
      name: data.name,
      providerType: data.providerType,
      senderNumber: data.senderNumber,
      baseUrl: data.baseUrl,
      customPayloadTemplate: data.customPayloadTemplate,
    };

    if (data.apiKey && data.apiKey !== '********') {
      updateData.encryptedApiKey = EncryptionUtil.encrypt(data.apiKey);
    }
    if (data.username && data.username !== '********') {
      updateData.encryptedUsername = EncryptionUtil.encrypt(data.username);
    }
    if (data.password && data.password !== '********') {
      updateData.encryptedPassword = EncryptionUtil.encrypt(data.password);
    }
    if (data.customHeaders && data.customHeaders !== '********') {
      updateData.customHeadersEncrypted = EncryptionUtil.encrypt(typeof data.customHeaders === 'string' ? data.customHeaders : JSON.stringify(data.customHeaders));
    }

    const updated = await this.prisma.smsProviderConfig.update({
      where: { id },
      data: updateData
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'SMS_PROVIDER_UPDATED',
        entityType: 'SmsProviderConfig',
        entityId: id,
        newValue: { name: updated.name }
      }
    });

    return { message: 'Provider updated' };
  }

  async activateSmsProvider(id: string, userId: string) {
    await this.prisma.smsProviderConfig.update({
      where: { id },
      data: { status: 'Active' }
    });

    await this.prisma.auditLog.create({
      data: { action: 'SMS_PROVIDER_ACTIVATED', entityType: 'SmsProviderConfig', entityId: id, newValue: { status: 'Active' } }
    });

    return { message: 'Provider activated' };
  }

  async deactivateSmsProvider(id: string, userId: string) {
    const current = await this.prisma.smsProviderConfig.findUnique({ where: { id } });
    if (current?.isDefault) throw new Error('Cannot deactivate the default provider. Change the default provider first.');

    await this.prisma.smsProviderConfig.update({
      where: { id },
      data: { status: 'Inactive' }
    });

    await this.prisma.auditLog.create({
      data: { action: 'SMS_PROVIDER_DEACTIVATED', entityType: 'SmsProviderConfig', entityId: id, newValue: { status: 'Inactive' } }
    });

    return { message: 'Provider deactivated' };
  }

  async setDefaultSmsProvider(id: string, userId: string) {
    const target = await this.prisma.smsProviderConfig.findUnique({ where: { id } });
    if (!target) throw new Error('Provider not found');
    if (target.status !== 'Active') throw new Error('Only active providers can be set as default');

    // Transactionally unset all other defaults and set the target
    await this.prisma.$transaction(async (tx) => {
      await tx.smsProviderConfig.updateMany({
        where: { id: { not: id } },
        data: { isDefault: false }
      });

      await tx.smsProviderConfig.update({
        where: { id },
        data: { isDefault: true }
      });

      await tx.auditLog.create({
        data: { action: 'SMS_PROVIDER_SET_DEFAULT', entityType: 'SmsProviderConfig', entityId: id, newValue: { name: target.name } }
      });
    });

    return { message: 'Default provider updated' };
  }

  async testProvider(id: string, recipient: string, userId: string) {
    const providerInstance = await this.smsRegistry.getProviderById(id);
    if (!providerInstance) throw new Error('Provider instance could not be created');

    try {
      // Send directly without BullMQ queue so we get immediate feedback for the tester
      const messageId = await providerInstance.send(recipient, 'This is a test message to verify the provider configuration.');
      
      await this.prisma.smsProviderConfig.update({
        where: { id },
        data: { lastTestedAt: new Date(), lastTestStatus: 'Success' }
      });

      await this.prisma.auditLog.create({
        data: { action: 'SMS_PROVIDER_TESTED', entityType: 'SmsProviderConfig', entityId: id, newValue: { recipient, messageId } }
      });

      return { success: true, messageId };
    } catch (error: any) {
      await this.prisma.smsProviderConfig.update({
        where: { id },
        data: { lastTestedAt: new Date(), lastTestStatus: 'Failed' }
      });

      await this.prisma.auditLog.create({
        data: { action: 'SMS_PROVIDER_TEST_FAILED', entityType: 'SmsProviderConfig', entityId: id, newValue: { error: error.message } }
      });

      throw new Error(`Provider test failed: ${error.message}`);
    }
  }
}
