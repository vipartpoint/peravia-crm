import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface LogActivityParams {
  entityType: string;
  entityId: string;
  activityType: string;
  title: string;
  description?: string;
  metadata?: any;
  visibility?: string;
  priority?: string;
  relatedUserId?: string;
}

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async logActivity(params: LogActivityParams, userId: string) {
    return this.prisma.activity.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        activityType: params.activityType,
        title: params.title,
        description: params.description,
        metadata: params.metadata || {},
        visibility: params.visibility || 'Internal',
        priority: params.priority,
        relatedUserId: params.relatedUserId,
        createdBy: userId !== 'system-user' ? userId : await this.getFallbackUserId(params.entityType, params.entityId)
      }
    });
  }

  // To prevent FK errors when createdBy is missing (e.g. system background events)
  private async getFallbackUserId(entityType: string, entityId: string): Promise<string> {
    try {
      if (entityType === 'Opportunity') {
        const opp = await this.prisma.opportunity.findUnique({ where: { id: entityId } });
        if (opp?.ownerId) return opp.ownerId;
        if (opp?.createdBy) return opp.createdBy;
      }
      if (entityType === 'Lead') {
        const lead = await this.prisma.lead.findUnique({ where: { id: entityId } });
        if (lead?.createdBy) return lead.createdBy;
      }
      if (entityType === 'Customer') {
        const cust = await this.prisma.customer.findUnique({ where: { id: entityId } });
        if (cust?.createdBy) return cust.createdBy;
      }
      
      // Fallback: Just get the first admin or user to avoid FK error
      const anyUser = await this.prisma.user.findFirst();
      return anyUser?.id || 'system-user';
    } catch (e) {
      return 'system-user';
    }
  }

  async checkEntityAccess(entityType: string, entityId: string, userId: string, role: string): Promise<boolean> {
    if (role === 'SystemAdmin') return true;

    try {
      if (entityType === 'Opportunity') {
        const opp = await this.prisma.opportunity.findUnique({ where: { id: entityId } });
        if (!opp) return false;
        if (role === 'SalesManager') return true; // assuming manager sees territory/team
        return opp.ownerId === userId || opp.createdBy === userId;
      }
      if (entityType === 'Lead') {
        const lead = await this.prisma.lead.findUnique({ where: { id: entityId } });
        if (!lead) return false;
        return role === 'SalesManager' ? true : lead.createdBy === userId;
      }
      if (entityType === 'Customer') {
        const customer = await this.prisma.customer.findUnique({ where: { id: entityId } });
        if (!customer) return false;
        return role === 'SalesManager' ? true : customer.createdBy === userId;
      }
      // For now, allow reading for other entities if not strictly defined, or block by default
      return true;
    } catch (e) {
      return false;
    }
  }

  async getEntityActivities(entityType: string, entityId: string, userId: string, role: string) {
    const hasAccess = await this.checkEntityAccess(entityType, entityId, userId, role);
    if (!hasAccess) {
      throw new UnauthorizedException('شما دسترسی مشاهده تاریخچه این آیتم را ندارید.');
    }

    return this.prisma.activity.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, username: true, email: true }
        }
      }
    });
  }

  async getRecentActivities(userId: string, role: string, filters: any = {}) {
    // If not admin, we could strictly filter activities by querying accessible entities first, 
    // or just filter activities created by the user, or rely on related user logic.
    // For a generic "Recent Activities" dashboard widget:
    const where: any = {};
    
    if (role !== 'SystemAdmin' && role !== 'SalesManager') {
      where.createdBy = userId; // Very strict for SalesRep: only see their own activities
    }

    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.activityType) where.activityType = filters.activityType;

    return this.prisma.activity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit ? Number(filters.limit) : 20,
      include: {
        user: { select: { username: true, email: true } }
      }
    });
  }
}
