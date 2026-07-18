import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import * as crypto from 'crypto';
import { ActivitiesService } from '../activities/activities.service';

import { NotificationsCenterService } from '../notifications-center/notifications-center.service';

@Injectable()
export class LeadsService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly key = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012';

  constructor(
    private prisma: PrismaService, 
    private activitiesService: ActivitiesService,
    private notificationsCenter: NotificationsCenterService
  ) {}

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(this.key), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  decrypt(text: string): string {
    try {
      const parts = text.split(':');
      if (parts.length !== 2) return text;
      const iv = Buffer.from(parts[0], 'hex');
      const encryptedText = Buffer.from(parts[1], 'hex');
      const decipher = crypto.createDecipheriv(this.algorithm, Buffer.from(this.key), iv);
      let decrypted = decipher.update(encryptedText);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return decrypted.toString('utf8');
    } catch {
      return text;
    }
  }

  maskPhone(phone: string): string {
    if (!phone || phone.length < 7) return '***';
    return phone.substring(0, 4) + '****' + phone.substring(phone.length - 3);
  }

  async create(createLeadDto: CreateLeadDto, user: any) {
    let { phone, currentStageId, nextFollowUpAt, ...data } = createLeadDto;
    
    if (!currentStageId) {
      const defaultStage = await this.prisma.salesFunnelStage.findUnique({ where: { name: 'Lead' } });
      if (defaultStage) currentStageId = defaultStage.id;
    }

    const encryptedPhone = this.encrypt(phone);

    const lead = await this.prisma.lead.create({
      data: {
        ...data,
        phone: encryptedPhone,
        currentStageId,
        nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt) : null,
        createdBy: user.id
      }
    });

    if (currentStageId) {
      await this.prisma.leadStageHistory.create({
        data: {
          leadId: lead.id,
          stageId: currentStageId,
          changedBy: user.id
        }
      });
    }

    await this.logAudit(user.id, 'CREATE_LEAD', 'Lead', lead.id, null, { name: lead.name });
    
    await this.activitiesService.logActivity({
      entityType: 'Lead',
      entityId: lead.id,
      activityType: 'Created',
      title: 'ایجاد سرنخ فروش',
      description: `سرنخ فروش جدید با نام ${lead.name} در سیستم ثبت شد.`
    }, user.id);
    
    if (lead.assignedTo && lead.assignedTo !== user.id) {
      await this.notificationsCenter.createNotification({
        userId: lead.assignedTo,
        title: 'تخصیص سرنخ جدید',
        message: `سرنخ جدید ${lead.name} به شما اختصاص داده شد.`,
        type: 'Info',
        priority: 'Medium',
        entityType: 'Lead',
        entityId: lead.id,
        actionUrl: `/leads/dashboard`
      });
    }

    return lead;
  }

  async findAll(user: any) {
    let whereClause: any = { deletedAt: null };

    if (user.role.name === 'SalesRep') {
      whereClause.assignedTo = user.id;
    } else if (user.role.name === 'RegionalManager') {
      const managed = await this.prisma.territory.findMany({ where: { managerId: user.id } });
      const managedIds = managed.map(t => t.id);
      
      const allTerritories = await this.prisma.territory.findMany();
      const visibleTerritories = new Set<string>(managedIds);
      const addChildren = (parentId: string) => {
        for (const t of allTerritories) {
          if (t.parentId === parentId && !visibleTerritories.has(t.id)) {
            visibleTerritories.add(t.id);
            addChildren(t.id);
          }
        }
      };
      for (const id of managedIds) addChildren(id);
      
      whereClause.territoryId = { in: Array.from(visibleTerritories) };
    }

    const leads = await this.prisma.lead.findMany({
      where: whereClause,
      include: {
        stage: true,
        assignedUser: { select: { username: true } },
        territory: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return leads.map(l => ({
      ...l,
      phone: this.maskPhone(this.decrypt(l.phone))
    }));
  }

  async findOne(id: string, user: any) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        stage: true,
        assignedUser: { select: { id: true, username: true } },
        territory: { select: { id: true, name: true } },
        stageHistory: {
          include: { stage: true, user: { select: { username: true } } },
          orderBy: { enteredAt: 'desc' }
        },
        presentations: {
          include: { product: { select: { name: true } }, user: { select: { username: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!lead || lead.deletedAt) throw new NotFoundException('Lead not found');

    if (user.role.name === 'SalesRep' && lead.assignedTo !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    const decryptedPhone = this.decrypt(lead.phone);
    return {
      ...lead,
      phone: this.maskPhone(decryptedPhone),
      _fullPhoneForEdit: decryptedPhone // Sent only to pre-fill edit forms for authorized, but masked overall in UI
    };
  }

  async revealPhone(id: string, user: any, isCall: boolean = false) {
    if (!['CEO', 'SalesManager', 'SystemAdmin', 'Finance'].includes(user.role.name) && user.role.name !== 'RegionalManager' && user.role.name !== 'SalesRep') {
       throw new ForbiddenException('Not authorized to view full phone number');
    }
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');

    const decryptedPhone = this.decrypt(lead.phone);
    
    if (isCall) {
      await this.logAudit(user.id, 'VIEW_LEAD_PHONE_FOR_CALL', 'Lead', id, null, { action: 'Called' });
    } else {
      await this.logAudit(user.id, 'VIEW_SENSITIVE_LEAD_DATA', 'Lead', id, null, { action: 'Reveal Phone' });
    }
    return { phone: decryptedPhone };
  }

  async update(id: string, updateLeadDto: UpdateLeadDto, user: any) {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');

    if (user.role.name === 'SalesRep' && lead.assignedTo !== user.id && lead.createdBy !== user.id) {
      throw new ForbiddenException('You do not have permission to modify this lead');
    }

    let { phone, currentStageId, nextFollowUpAt, ...data } = updateLeadDto;
    let dataToUpdate: any = { ...data };

    if (phone) {
      dataToUpdate.phone = this.encrypt(phone);
    }
    if (nextFollowUpAt) {
      dataToUpdate.nextFollowUpAt = new Date(nextFollowUpAt);
    }

    if (currentStageId && currentStageId !== lead.currentStageId) {
      // Stage changed
      const newStage = await this.prisma.salesFunnelStage.findUnique({ where: { id: currentStageId } });
      if (!newStage) throw new BadRequestException('Stage not found');

      if (newStage.name === 'Lost' && !dataToUpdate.lostReason) {
        throw new BadRequestException('Lost reason is required when moving to Lost stage');
      }

      if (newStage.name === 'Won / Order') {
        throw new BadRequestException('Cannot move directly to Won / Order. Use the conversion flow instead.');
      }

      // Close previous history
      const lastHistory = await this.prisma.leadStageHistory.findFirst({
        where: { leadId: id, leftAt: null },
        orderBy: { enteredAt: 'desc' }
      });

      if (lastHistory) {
        const durationDays = (Date.now() - lastHistory.enteredAt.getTime()) / (1000 * 60 * 60 * 24);
        await this.prisma.leadStageHistory.update({
          where: { id: lastHistory.id },
          data: { leftAt: new Date(), durationDays }
        });
      }

      await this.prisma.leadStageHistory.create({
        data: {
          leadId: id,
          stageId: currentStageId,
          changedBy: user.id
        }
      });
      dataToUpdate.currentStageId = currentStageId;
      await this.logAudit(user.id, 'CHANGE_LEAD_STAGE', 'Lead', id, { stage: lead.currentStageId }, { stage: currentStageId });
      
      await this.activitiesService.logActivity({
        entityType: 'Lead',
        entityId: id,
        activityType: 'StageChanged',
        title: 'تغییر وضعیت سرنخ',
        description: `مرحله سرنخ از ${lead.currentStageId} به ${newStage.name} تغییر یافت.` // Using name as a quick label
      }, user.id);
    }

    const updated = await this.prisma.lead.update({
      where: { id },
      data: dataToUpdate
    });

    await this.logAudit(user.id, 'UPDATE_LEAD', 'Lead', id, { status: lead.status }, { status: updated.status });
    return updated;
  }

  async convertToCustomer(id: string, customerData: any, user: any) {
    // This is called when user submits the conversion form
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');

    const wonStage = await this.prisma.salesFunnelStage.findUnique({ where: { name: 'Won / Order' } });

    let customerId = customerData.customerId;

    if (!customerId) {
      // Create new customer
      const newCustomer = await this.prisma.customer.create({
        data: {
          name: customerData.name || lead.name,
          customerType: customerData.customerType || 'Retail',
          brandScope: customerData.brandScope || lead.brandInterest,
          loyaltyTier: 'Bronze',
          phone: lead.phone, // Already encrypted
          nationalId: customerData.nationalId ? this.encrypt(customerData.nationalId) : undefined,
          territoryId: lead.territoryId,
          assignedUserId: lead.assignedTo,
          createdBy: user.id
        }
      });
      customerId = newCustomer.id;
    }

    // Close stage history
    const lastHistory = await this.prisma.leadStageHistory.findFirst({
      where: { leadId: id, leftAt: null },
      orderBy: { enteredAt: 'desc' }
    });

    if (lastHistory) {
      const durationDays = (Date.now() - lastHistory.enteredAt.getTime()) / (1000 * 60 * 60 * 24);
      await this.prisma.leadStageHistory.update({
        where: { id: lastHistory.id },
        data: { leftAt: new Date(), durationDays }
      });
    }

    await this.prisma.leadStageHistory.create({
      data: {
        leadId: id,
        stageId: wonStage!.id,
        changedBy: user.id
      }
    });

    const updated = await this.prisma.lead.update({
      where: { id },
      data: {
        status: 'Converted',
        currentStageId: wonStage!.id,
        customerId
      }
    });

    await this.logAudit(user.id, 'CONVERT_LEAD_TO_CUSTOMER', 'Lead', id, null, { customerId });
    
    await this.activitiesService.logActivity({
      entityType: 'Lead',
      entityId: id,
      activityType: 'StageChanged',
      title: 'تبدیل سرنخ به مشتری',
      description: `سرنخ فروش تأیید و به مشتری سیستم (کد ${customerId}) تبدیل شد.`
    }, user.id);
    
    return updated;
  }

  async remove(id: string, user: any, reason?: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');

    if (user.role.name === 'SalesRep' && lead.assignedTo !== user.id && lead.createdBy !== user.id) {
      throw new ForbiddenException('You do not have permission to delete this lead');
    }

    const archived = await this.prisma.lead.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: user.id, deleteReason: reason || 'N/A' }
    });
    await this.logAudit(user.id, 'ARCHIVE_LEAD', 'Lead', id, null, null);
    return archived;
  }

  private async logAudit(userId: string, action: string, entityType: string, entityId: string, oldValue: any, newValue: any) {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
        newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
      }
    });
  }
}
