import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(createTaskDto: CreateTaskDto, user: any) {
    // Validate polymorphic relation if provided
    if (createTaskDto.relatedType && createTaskDto.relatedId) {
      const type = createTaskDto.relatedType;
      let exists = false;
      if (type === 'Customer') exists = !!(await this.prisma.customer.findUnique({ where: { id: createTaskDto.relatedId } }));
      if (type === 'Lead') exists = !!(await this.prisma.lead.findUnique({ where: { id: createTaskDto.relatedId } }));
      if (type === 'Order') exists = !!(await this.prisma.order.findUnique({ where: { id: createTaskDto.relatedId } }));
      if (type === 'Visit') exists = !!(await this.prisma.visit.findUnique({ where: { id: createTaskDto.relatedId } }));
      
      if (!exists) {
        throw new BadRequestException(`Related ${type} not found.`);
      }
    }

    const { dueAt, ...data } = createTaskDto;

    const task = await this.prisma.task.create({
      data: {
        ...data,
        createdBy: user.id,
        dueAt: dueAt ? new Date(dueAt) : null,
      }
    });

    await this.logAudit(user.id, 'CREATE_TASK', 'Task', task.id, null, task);
    return task;
  }

  async getTodayTasks(user: any) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    let whereClause: any = { 
      deletedAt: null,
      dueAt: { gte: todayStart, lte: todayEnd }
    };
    if (user.role.name === 'SalesRep') whereClause.assignedTo = user.id;

    return this.prisma.task.findMany({
      where: whereClause,
      include: { assignee: { select: { username: true } } },
      orderBy: { dueAt: 'asc' }
    });
  }

  async getOverdueTasks(user: any) {
    const now = new Date();
    let whereClause: any = { 
      deletedAt: null,
      dueAt: { lt: now },
      status: { notIn: ['Done', 'Cancelled'] }
    };
    if (user.role.name === 'SalesRep') whereClause.assignedTo = user.id;

    const tasks = await this.prisma.task.findMany({
      where: whereClause,
      include: { assignee: { select: { username: true } } },
      orderBy: { dueAt: 'desc' }
    });
    
    return tasks.map(t => ({ ...t, status: 'Overdue' }));
  }

  async findAll(user: any) {
    let whereClause: any = { deletedAt: null };

    if (user.role.name === 'SalesRep') {
      whereClause.assignedTo = user.id;
    }

    const tasks = await this.prisma.task.findMany({
      where: whereClause,
      include: {
        assignee: { select: { username: true } },
        creator: { select: { username: true } },
      },
      orderBy: { dueAt: 'asc' }
    });

    // Dynamic Overdue calculation
    const now = new Date();
    return tasks.map(t => {
      if (t.dueAt && t.dueAt < now && t.status !== 'Done' && t.status !== 'Cancelled') {
        return { ...t, status: 'Overdue' }; // TODO: Future scheduled CRON job to update DB directly
      }
      return t;
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { assignee: { select: { username: true } }, creator: { select: { username: true } } }
    });
    if (!task || task.deletedAt) throw new NotFoundException('Task not found');
    
    // Dynamic Overdue calculation
    if (task.dueAt && task.dueAt < new Date() && task.status !== 'Done' && task.status !== 'Cancelled') {
      task.status = 'Overdue';
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, user: any) {
    const existing = await this.prisma.task.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Task not found');

    const { dueAt, ...data } = updateTaskDto;
    
    const updateData: any = { ...data };
    if (dueAt) updateData.dueAt = new Date(dueAt);

    if (updateData.status === 'Done' && existing.status !== 'Done') {
      updateData.completedAt = new Date();
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data: updateData
    });

    await this.logAudit(user.id, 'UPDATE_TASK', 'Task', id, existing, updated);
    return updated;
  }

  async remove(id: string, user: any) {
    const archived = await this.prisma.task.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: user.id }
    });
    await this.logAudit(user.id, 'CANCEL_TASK', 'Task', id, null, null);
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
