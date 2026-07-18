import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ResourceAccessService {
  constructor(private prisma: PrismaService) {}

  /**
   * Verifies if a user has access to a specific record based on Territory or Ownership rules.
   * If the user is an Admin, CEO, or has overarching permissions, it passes.
   * Otherwise, it checks if the record belongs to the user or their territory.
   */
  async verifyAccess(
    user: any,
    resourceType: 'Order' | 'Customer' | 'Lead' | 'Task',
    resourceId: string
  ) {
    // 1. Global Bypass Roles
    const globalRoles = ['SystemAdmin', 'CEO', 'SalesManager'];
    if (globalRoles.includes(user.role.name)) {
      return true; // Full access
    }

    // 2. Fetch User Territory Information
    const userDb = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { territory: true }
    });

    if (!userDb) throw new ForbiddenException('User not found in access policy');

    const territoryId = userDb.territoryId;

    // 3. Evaluate based on Resource Type
    switch (resourceType) {
      case 'Order':
        const order = await this.prisma.order.findUnique({
          where: { id: resourceId },
          include: { customer: true }
        });
        if (!order) throw new NotFoundException('Order not found');
        
        // Allowed if user created it, is assigned to the customer, or shares the territory
        if (order.userId === user.id || order.customer.territoryId === territoryId) {
          return true;
        }
        break;

      case 'Customer':
      case 'Lead':
        const customer = await this.prisma.customer.findUnique({ where: { id: resourceId } });
        if (!customer) throw new NotFoundException('Customer/Lead not found');
        
        if (customer.createdBy === user.id || customer.assignedUserId === user.id || customer.territoryId === territoryId) {
          return true;
        }
        break;

      case 'Task':
        const task = await this.prisma.task.findUnique({ where: { id: resourceId } });
        if (!task) throw new NotFoundException('Task not found');
        
        if (task.createdBy === user.id || task.assignedTo === user.id) {
          return true;
        }
        break;

      default:
        throw new ForbiddenException('Resource type access policy not defined');
    }

    // If we reach here, no ownership rule passed
    throw new ForbiddenException(`You do not have territory or ownership rights to access this ${resourceType}`);
  }

  /**
   * Helper to append Prisma 'where' clauses dynamically for list queries
   */
  applyListScope(user: any) {
    const globalRoles = ['SystemAdmin', 'CEO', 'SalesManager'];
    if (globalRoles.includes(user.role.name)) {
      return {}; // No filter, return all
    }

    // Filter to user's assigned records OR records in their territory
    return {
      OR: [
        { assignedUserId: user.id },
        { createdBy: user.id },
        // This requires the parent query to join territory if relevant, handled by specific service
      ]
    };
  }
}
