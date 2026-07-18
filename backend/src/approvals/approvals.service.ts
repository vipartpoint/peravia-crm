import { Injectable, ForbiddenException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class ApprovalsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    @Inject(forwardRef(() => OrdersService))
    private ordersService: OrdersService
  ) {}

  async createWorkflowRequest(data: any, currentUser: any) {
    const request = await this.prisma.approvalRequest.create({
      data: {
        requestType: data.requestType,
        entityType: data.entityType,
        entityId: data.entityId,
        requestedBy: data.requestedBy,
        currentLevel: 1,
        requiredLevels: data.requiredLevels,
        requiredRoles: data.requiredRoles,
        status: 'Pending',
        reason: data.reason
      }
    });

    await this.prisma.auditLog.create({
      data: { userId: currentUser.id, action: 'APPROVAL_REQUEST_CREATED', entityType: 'ApprovalRequest', entityId: request.id }
    });

    // Notify the first level role
    if (data.requiredRoles && data.requiredRoles.length > 0) {
      await this.notifyRole(data.requiredRoles[0], request.id, data.requestType);
    }

    return request;
  }

  private async notifyRole(roleName: string, requestId: string, requestType: string) {
    const notifyUsers = await this.prisma.user.findMany({ where: { role: { name: roleName }, deletedAt: null } });
    await Promise.all(notifyUsers.map(u => this.notificationsService.sendNotification({
        userId: u.id,
        title: 'درخواست تأیید جدید',
        message: `یک درخواست ${requestType} در صف بررسی شما قرار گرفت.`,
        type: 'Approval',
        priority: 'Warning',
        entityType: 'ApprovalRequest',
        entityId: requestId,
        fingerprint: `APPROVAL_REQ_${requestId}_${u.id}`
    })));
  }

  async getMyRequests(userId: string) {
    // Map db columns to existing UI format to preserve compatibility
    const requests = await this.prisma.approvalRequest.findMany({
      where: { requestedBy: userId },
      include: { history: { include: { actor: { select: { username: true } } } } },
      orderBy: { createdAt: 'desc' }
    });
    return requests.map(r => ({
      ...r,
      approvalLevel: r.currentLevel,
      comments: r.reason
    }));
  }

  async getPendingApprovals(user: any) {
    const allPending = await this.prisma.approvalRequest.findMany({
      where: { status: 'Pending' },
      include: { requester: { select: { username: true } } },
      orderBy: { createdAt: 'asc' }
    });

    // Filter queue based on user role dynamically matching requiredRole for current level
    const userRole = user.role.name;
    const filtered = allPending.filter(req => {
      const roles = req.requiredRoles as string[];
      const requiredRole = roles[req.currentLevel - 1];
      return requiredRole === userRole;
    });

    return filtered.map(r => ({
      ...r,
      approvalLevel: r.currentLevel,
      comments: r.reason
    }));
  }

  async processApproval(id: string, action: 'Approved' | 'Rejected', comments: string, currentUser: any) {
    const request = await this.prisma.approvalRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Approval request not found');
    
    if (request.status !== 'Pending') {
      throw new BadRequestException('Request is no longer pending');
    }

    // Self Approval Protection
    if (request.requestedBy === currentUser.id) {
      throw new ForbiddenException('You cannot approve your own request');
    }

    const roles = request.requiredRoles as string[];
    const requiredRole = roles[request.currentLevel - 1];

    if (currentUser.role.name !== requiredRole && currentUser.role.name !== 'SystemAdmin') {
      throw new ForbiddenException(`Only ${requiredRole} can approve this level`);
    }

    if (action === 'Rejected' && (!comments || comments.trim() === '')) {
      throw new BadRequestException('Rejection requires a decision comment');
    }

    let nextStatus = request.status;
    let nextLevel = request.currentLevel;

    if (action === 'Rejected') {
      nextStatus = 'Rejected';
    } else if (action === 'Approved') {
      if (request.currentLevel === request.requiredLevels) {
        nextStatus = 'Approved';
      } else {
        nextLevel++;
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.approvalHistory.create({
        data: {
          approvalRequestId: id,
          level: request.currentLevel,
          roleRequired: requiredRole,
          action,
          actedBy: currentUser.id,
          comments
        }
      });

      await tx.approvalRequest.update({
        where: { id },
        data: {
          status: nextStatus,
          currentLevel: nextLevel,
          decisionComment: comments || request.decisionComment
        }
      });
    });

    await this.prisma.auditLog.create({
      data: { userId: currentUser.id, action: action === 'Approved' ? 'APPROVAL_LEVEL_GRANTED' : 'APPROVAL_REJECTED', entityType: 'ApprovalRequest', entityId: id }
    });

    // Post-Transaction actions
    if (nextStatus === 'Pending' && nextLevel > request.currentLevel) {
      // Escalated to next level
      const nextRole = roles[nextLevel - 1];
      await this.notifyRole(nextRole, request.id, request.requestType);
    } else if (nextStatus === 'Approved') {
      // Final Approval
      await this.prisma.auditLog.create({
        data: { userId: currentUser.id, action: 'APPROVAL_COMPLETED', entityType: 'ApprovalRequest', entityId: id }
      });
      await this.notificationsService.sendNotification({
        userId: request.requestedBy,
        title: 'درخواست تأیید شد',
        message: `درخواست ${request.requestType} شما نهایتاً تأیید شد.`,
        type: 'Approval',
        priority: 'Success',
        entityType: 'ApprovalRequest',
        entityId: request.id
      });
      
      if (request.entityType === 'Order') {
        await this.ordersService.applyApprovalDecision(request.entityId, 'Approved', currentUser, request.requestType);
      }
    } else if (nextStatus === 'Rejected') {
      await this.notificationsService.sendNotification({
        userId: request.requestedBy,
        title: 'درخواست رد شد',
        message: `درخواست ${request.requestType} شما رد شد. دلیل: ${comments}`,
        type: 'Approval',
        priority: 'Critical',
        entityType: 'ApprovalRequest',
        entityId: request.id
      });

      if (request.entityType === 'Order') {
        await this.ordersService.applyApprovalDecision(request.entityId, 'Rejected', currentUser, request.requestType);
      }
    }

    return { message: `Request ${action.toLowerCase()}` };
  }
}
// Add BadRequestException to imports
import { BadRequestException } from '@nestjs/common';
