import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';

@Injectable()
export class VisitsService {
  constructor(private prisma: PrismaService) {}

  async create(createVisitDto: CreateVisitDto, user: any) {
    if (!createVisitDto.customerId && !createVisitDto.leadId) {
      throw new BadRequestException('At least one of customerId or leadId is required.');
    }

    const { scheduledAt, nextFollowUpAt, ...data } = createVisitDto;

    const visit = await this.prisma.visit.create({
      data: {
        ...data,
        userId: user.id,
        scheduledAt: new Date(scheduledAt),
        nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt) : null,
      }
    });

    await this.logAudit(user.id, 'CREATE_VISIT', 'Visit', visit.id, null, visit);
    return visit;
  }

  async getTodayVisits(user: any) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    let whereClause: any = { 
      deletedAt: null,
      scheduledAt: { gte: todayStart, lte: todayEnd }
    };
    if (user.role.name === 'SalesRep') whereClause.userId = user.id;
    else if (user.role.name === 'RegionalManager') whereClause.territoryId = user.territoryId;

    return this.prisma.visit.findMany({
      where: whereClause,
      include: {
        customer: { select: { name: true } },
        lead: { select: { name: true } },
        user: { select: { username: true } },
      },
      orderBy: { scheduledAt: 'asc' }
    });
  }

  async findAll(user: any) {
    let whereClause: any = { deletedAt: null };

    if (user.role.name === 'SalesRep') {
      whereClause.userId = user.id;
    } else if (user.role.name === 'RegionalManager') {
      whereClause.territoryId = user.territoryId; // Simplify for MVP
    }

    return this.prisma.visit.findMany({
      where: whereClause,
      include: {
        customer: { select: { name: true } },
        lead: { select: { name: true } },
        user: { select: { username: true } },
        territory: { select: { name: true } },
      },
      orderBy: { scheduledAt: 'desc' }
    });
  }

  async findOne(id: string) {
    const visit = await this.prisma.visit.findUnique({
      where: { id },
      include: { customer: true, lead: true, user: { select: { username: true } }, territory: true }
    });
    if (!visit || visit.deletedAt) throw new NotFoundException('Visit not found');
    return visit;
  }

  async update(id: string, updateVisitDto: UpdateVisitDto, user: any) {
    const existing = await this.prisma.visit.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Visit not found');

    const { scheduledAt, nextFollowUpAt, ...data } = updateVisitDto;
    
    const updateData: any = { ...data };
    if (scheduledAt) updateData.scheduledAt = new Date(scheduledAt);
    if (nextFollowUpAt) updateData.nextFollowUpAt = new Date(nextFollowUpAt);

    // Auto complete Task creation
    if (updateData.status === 'Completed' && existing.status !== 'Completed') {
      updateData.completedAt = new Date();
    }

    const updated = await this.prisma.visit.update({
      where: { id },
      data: updateData
    });

    if (updated.status === 'Completed' && updated.nextFollowUpAt && existing.status !== 'Completed') {
      await this.prisma.task.create({
        data: {
          title: 'پیگیری بعد از ویزیت',
          relatedType: 'Visit',
          relatedId: updated.id,
          assignedTo: updated.userId,
          createdBy: user.id,
          dueAt: updated.nextFollowUpAt,
          priority: 'Normal',
          status: 'Open'
        }
      });
      await this.logAudit(user.id, 'CREATE_TASK', 'Task', 'auto', null, { title: 'Auto follow-up task' });
    }

    await this.logAudit(user.id, 'UPDATE_VISIT', 'Visit', id, existing, updated);
    return updated;
  }

  async remove(id: string, user: any) {
    const archived = await this.prisma.visit.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: user.id }
    });
    await this.logAudit(user.id, 'ARCHIVE_VISIT', 'Visit', id, null, null);
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
