import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsCenterService } from '../notifications-center/notifications-center.service';
import { ActivitiesService } from '../activities/activities.service';

@Injectable()
export class ApprovalCenterService {
  private readonly logger = new Logger(ApprovalCenterService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsCenterService,
    private activitiesService: ActivitiesService,
  ) {}

  async findAll(userId: string, roleName: string, query: Record<string, any>) {
    const { status, type, priority, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {};

    // RBAC
    if (roleName === 'SystemAdmin') {
      // Full access
    } else if (roleName === 'Finance') {
      where.requestType = { in: ['PaymentApproval', 'ChequeApproval', 'FinanceApproval'] };
    } else if (roleName === 'WarehouseManager') {
      where.requestType = { in: ['WarehouseTransfer', 'InventoryShortage'] };
    } else if (roleName === 'FactoryManager') {
      where.requestType = { in: ['ProductionApproval', 'InventoryShortage'] };
    } else if (roleName === 'SalesManager') {
      where.entityType = 'Order';
    } else if (roleName === 'SalesRep') {
      where.requestedBy = userId; // Can only view their own requests
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (type) where.requestType = type;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { reason: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.approvalRequest.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip: Number(skip),
        take: Number(limit),
        include: {
          requester: { select: { username: true } },
          approver: { select: { username: true } }
        }
      }),
      this.prisma.approvalRequest.count({ where })
    ]);

    return { data: this.mapToUnifiedDto(items), total, page: Number(page), limit: Number(limit) };
  }

  async getMyPending(userId: string) {
    // Things I need to approve: either assigned to me directly, or my role is required (for Orders)
    // We fetch pending where assignedApprover = userId. 
    // For Order multi-level approvals, it relies on requiredRoles array matching user's role.
    const directAssigned = await this.prisma.approvalRequest.findMany({
      where: { assignedApprover: userId, status: 'Pending' },
      include: {
        requester: { select: { username: true } },
        approver: { select: { username: true } }
      }
    });
    
    // Note: If you want to include Role-based pending approvals (like Orders), you'd aggregate them here.
    return this.mapToUnifiedDto(directAssigned);
  }

  async findOne(id: string, userId: string, roleName: string) {
    const item = await this.prisma.approvalRequest.findUnique({
      where: { id },
      include: {
        requester: { select: { username: true } },
        approver: { select: { username: true } },
        history: {
          include: { actor: { select: { username: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!item) throw new NotFoundException('Approval request not found');

    // RBAC: Simple check, SalesRep can only view their own
    if (roleName === 'SalesRep' && item.requestedBy !== userId) {
      throw new ForbiddenException('You can only view approvals you requested');
    }

    return this.mapToUnifiedDto([item])[0];
  }

  async processApproval(id: string, userId: string, roleName: string, action: 'Approved' | 'Rejected', comments: string) {
    const request = await this.prisma.approvalRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Approval request not found');
    if (request.status !== 'Pending') throw new BadRequestException('Request is no longer pending');

    if (action === 'Rejected' && (!comments || comments.trim() === '')) {
      throw new BadRequestException('Rejection requires a decision comment');
    }

    if (roleName === 'SalesRep') {
      throw new ForbiddenException('SalesRep cannot approve or reject requests');
    }

    // Role specific bounds
    if (roleName === 'Finance' && !['PaymentApproval', 'ChequeApproval', 'FinanceApproval'].includes(request.requestType)) {
      throw new ForbiddenException('Finance can only approve financial requests');
    }
    if (roleName === 'WarehouseManager' && !['WarehouseTransfer', 'InventoryShortage'].includes(request.requestType)) {
      throw new ForbiddenException('WarehouseManager can only approve warehouse requests');
    }
    if (roleName === 'FactoryManager' && !['ProductionApproval', 'InventoryShortage'].includes(request.requestType)) {
      throw new ForbiddenException('FactoryManager can only approve production/shortage requests');
    }

    // Handle Order multi-level approvals dynamically by checking requiredRoles
    if (request.entityType === 'Order' && request.requiredRoles) {
      const roles = request.requiredRoles as string[];
      if (roles.length > 0) {
        const requiredRole = roles[request.currentLevel - 1];
        if (roleName !== requiredRole && roleName !== 'SystemAdmin') {
          throw new ForbiddenException(`Only ${requiredRole} can approve this level`);
        }
      }
    }

    let nextStatus: string = action;
    let nextLevel = request.currentLevel;

    if (action === 'Approved' && request.entityType === 'Order' && request.requiredLevels > request.currentLevel) {
      nextStatus = 'Pending';
      nextLevel++;
    }

    const updated = await this.prisma.approvalRequest.update({
      where: { id },
      data: {
        status: nextStatus,
        decisionComment: comments,
        currentLevel: nextLevel,
        approvedAt: action === 'Approved' && nextStatus === 'Approved' ? new Date() : request.approvedAt,
        rejectedAt: action === 'Rejected' ? new Date() : request.rejectedAt,
      }
    });

    await this.prisma.approvalHistory.create({
      data: {
        approvalRequestId: id,
        level: request.currentLevel,
        roleRequired: roleName,
        action,
        actedBy: userId,
        comments
      }
    });

    // Fire Activities
    this.activitiesService.logActivity({
      title: action === 'Approved' ? 'درخواست تأیید شد' : 'درخواست رد شد',
      entityType: 'ApprovalRequest',
      entityId: id,
      activityType: action === 'Approved' ? 'ApprovalApproved' : 'ApprovalRejected',
      metadata: { title: request.title, requestType: request.requestType, nextStatus }
    }, userId);

    // Fire Notifications
    this.notificationsService.createNotification({
      userId: request.requestedBy,
      title: action === 'Approved' ? 'درخواست تأیید شد' : 'درخواست رد شد',
      message: `درخواست ${request.title || request.requestType} شما ${action === 'Approved' ? 'تأیید' : 'رد'} شد.`,
      type: 'Alert',
      priority: action === 'Rejected' ? 'High' : 'Low',
      entityType: 'ApprovalRequest',
      entityId: id,
      actionUrl: `/approvals`
    });

    // Switch-based Callback Execution to Original Modules
    if (nextStatus === 'Approved' || nextStatus === 'Rejected') {
      await this.executeModuleCallback(updated, action);
    }

    return this.mapToUnifiedDto([updated])[0];
  }

  private async executeModuleCallback(request: any, action: 'Approved' | 'Rejected') {
    switch (request.entityType) {
      case 'InventoryShortage':
        // Update Inventory Shortage status
        await this.prisma.inventoryShortageRequest.updateMany({
          where: { id: request.entityId },
          data: { status: action === 'Approved' ? 'Resolved' : 'Rejected' }
        });
        break;

      case 'WarehouseTransfer':
        // Update Stock Transfer Request status
        await this.prisma.stockTransferRequest.updateMany({
          where: { id: request.entityId },
          data: { status: action === 'Approved' ? 'Approved' : 'Rejected' }
        });
        break;

      case 'Order':
        if (action === 'Approved') {
          // If the order reached final approval
          const order = await this.prisma.order.findUnique({ where: { id: request.entityId } });
          if (order && order.status === 'PendingApproval') {
            await this.prisma.order.update({
              where: { id: request.entityId },
              data: { status: 'Confirmed' } // Or Approved depending on workflow
            });
          }
        }
        break;

      // Add others like Finance/Cheque as needed
    }
  }

  async getDashboardMetrics(userId: string, roleName: string) {
    const where: any = {};
    if (roleName === 'SalesRep') where.requestedBy = userId;
    // other limits can apply

    const all = await this.prisma.approvalRequest.findMany({ where });

    const totalPending = all.filter(a => a.status === 'Pending').length;
    const totalApproved = all.filter(a => a.status === 'Approved').length;
    const totalRejected = all.filter(a => a.status === 'Rejected').length;
    
    const overdueApprovals = all.filter(a => a.status === 'Pending' && a.dueAt && new Date() > new Date(a.dueAt)).length;

    const pendingByType = all.reduce((acc: Record<string, number>, a) => {
      if (a.status === 'Pending') acc[a.requestType] = (acc[a.requestType] || 0) + 1;
      return acc;
    }, {});

    const pendingByPriority = all.reduce((acc: Record<string, number>, a) => {
      if (a.status === 'Pending') acc[a.priority] = (acc[a.priority] || 0) + 1;
      return acc;
    }, {});

    return {
      totalPending,
      totalApproved,
      totalRejected,
      overdueApprovals,
      pendingByType,
      pendingByPriority
    };
  }

  private mapToUnifiedDto(requests: any[]) {
    return requests.map(request => ({
      id: request.id,
      approvalType: request.requestType,
      entityType: request.entityType,
      entityId: request.entityId,
      requestedBy: request.requestedBy,
      requesterUsername: request.requester?.username,
      assignedTo: request.assignedApprover,
      approverUsername: request.approver?.username,
      title: request.title || `${request.requestType} for ${request.entityType}`,
      description: request.reason,
      priority: request.priority,
      status: request.status,
      metadata: request.metadata,
      requestedAt: request.createdAt,
      approvedAt: request.approvedAt,
      rejectedAt: request.rejectedAt,
      dueAt: request.dueAt,
      comments: request.decisionComment,
      currentLevel: request.currentLevel,
      requiredLevels: request.requiredLevels,
      history: request.history
    }));
  }
}
