import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsCenterService {
  private readonly logger = new Logger(NotificationsCenterService.name);

  constructor(private prisma: PrismaService) {}

  async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: string;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    entityType?: string;
    entityId?: string;
    actionUrl?: string;
    fingerprint?: string;
    metadata?: any;
  }) {
    // Check preferences (if any module specific logic applies)
    // For now, always create unless duplicate fingerprint is found and active

    if (data.fingerprint) {
      const existing = await this.prisma.notification.findUnique({
        where: { fingerprint: data.fingerprint }
      });

      if (existing) {
        if (existing.status === 'Unread') {
          // Already active and unread, bump timestamp to avoid spam
          return this.prisma.notification.update({
            where: { id: existing.id },
            data: { updatedAt: new Date() }
          });
        } else {
          // It was read/archived, reactivate it
          return this.prisma.notification.update({
            where: { id: existing.id },
            data: { status: 'Unread', updatedAt: new Date() }
          });
        }
      }
    }

    return this.prisma.notification.create({
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
  }

  async findAll(userId: string, role: string, query: any) {
    const { status, priority, type, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    // RBAC
    if (role === 'SalesRep') {
      where.userId = userId;
    } else if (role === 'SalesManager' || role === 'InventoryManager') {
      // In a real scenario, this would filter by users in their team. 
      // For simplicity, we can let them see their own + some team logic if available.
      // Assuming they see their own for now, or we can fetch team users.
      // Let's allow them to see all if they are manager for this test or just their own.
      where.userId = userId;
    } else if (role === 'SystemAdmin') {
      // Admins see all notifications OR we filter by userId if provided
      if (query.userId) where.userId = query.userId;
      else where.userId = userId; // Defaults to their own inbox
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip: Number(skip),
        take: Number(limit)
      }),
      this.prisma.notification.count({ where })
    ]);

    return { data: items, total, page: Number(page), limit: Number(limit) };
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, status: 'Unread' }
    });
  }

  async markAsRead(id: string, userId: string, role: string) {
    await this.verifyAccess(id, userId, role);
    return this.prisma.notification.update({
      where: { id },
      data: { status: 'Read', readAt: new Date() }
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, status: 'Unread' },
      data: { status: 'Read', readAt: new Date() }
    });
  }

  async archive(id: string, userId: string, role: string) {
    await this.verifyAccess(id, userId, role);
    return this.prisma.notification.update({
      where: { id },
      data: { status: 'Archived' }
    });
  }

  async delete(id: string, userId: string, role: string) {
    await this.verifyAccess(id, userId, role);
    return this.prisma.notification.delete({
      where: { id }
    });
  }

  private async verifyAccess(notificationId: string, userId: string, role: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification) throw new ForbiddenException('Notification not found');
    
    if (role === 'SystemAdmin') return true;
    
    // Simplistic RBAC: User must own it. (Managers team logic can be added later)
    if (notification.userId !== userId) {
      throw new ForbiddenException('Unauthorized to access this notification');
    }
    return true;
  }
}
