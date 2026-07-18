import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, PermissionRequirements } from '../decorators/permissions.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { user } = context.switchToHttp().getRequest();
    
    if (!user || !user.role) return false;

    // 1. SystemAdmin Safety (Fast-path bypass)
    if (user.role.name === 'SystemAdmin') {
      return true;
    }

    // 2. Existing RolesGuard logic
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredRoles && requiredRoles.includes(user.role.name)) {
      return true;
    }

    // 3. Explicit Permissions logic
    const requiredPermissions = this.reflector.getAllAndOverride<PermissionRequirements[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles and no permissions were specified, deny by default in strict mode, 
    // but to prevent breaking existing endpoints without decorators, we allow if no roles/perms are set.
    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    if (requiredPermissions && requiredPermissions.length > 0) {
      // Check if user has explicit permission overriding role
      const userPerms = await this.prisma.userPermission.findMany({
        where: { userId: user.id },
        include: { permission: true }
      });

      const rolePerms = await this.prisma.rolePermission.findMany({
        where: { role: { name: user.role.name } },
        include: { permission: true }
      });

      // User needs to satisfy at least one required permission block (or all? Usually ANY required is enough for endpoint access depending on design. Let's assume ANY for now).
      for (const reqPerm of requiredPermissions) {
        // Check User explicitly granted permission first
        const explicitGrant = userPerms.find(up => up.permission.category === reqPerm.category && up.permission.action === reqPerm.action);
        if (explicitGrant) {
          if (explicitGrant.isGranted) return true; // explicitly granted
          continue; // explicitly denied, check next
        }

        // Check Role granted permission
        const roleGrant = rolePerms.find(rp => rp.permission.category === reqPerm.category && rp.permission.action === reqPerm.action);
        if (roleGrant) return true;
      }
    }

    return false; // Neither Role nor Permissions matched
  }
}
