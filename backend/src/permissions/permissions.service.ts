import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async getAllPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ category: 'asc' }, { action: 'asc' }]
    });
  }

  async getRolePermissions(roleId: string) {
    const rolePerms = await this.prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true }
    });
    return rolePerms.map(rp => rp.permission);
  }

  async updateRolePermissions(roleId: string, permissionIds: string[], currentUser: any) {
    if (currentUser.role.name !== 'SystemAdmin') throw new ForbiddenException();

    await this.prisma.rolePermission.deleteMany({ where: { roleId } });
    
    const data = permissionIds.map(pid => ({ roleId, permissionId: pid }));
    if (data.length > 0) {
      await this.prisma.rolePermission.createMany({ data });
    }

    await this.prisma.auditLog.create({
      data: { userId: currentUser.id, action: 'PERMISSION_GRANTED', entityType: 'Role', entityId: roleId }
    });

    return { message: 'Permissions updated successfully' };
  }

  async getUserPermissions(userId: string) {
    return this.prisma.userPermission.findMany({
      where: { userId },
      include: { permission: true }
    });
  }

  async updateUserPermissions(userId: string, overrides: { permissionId: string, isGranted: boolean }[], currentUser: any) {
    if (currentUser.role.name !== 'SystemAdmin') throw new ForbiddenException();

    await this.prisma.userPermission.deleteMany({ where: { userId } });

    const data = overrides.map(o => ({ userId, permissionId: o.permissionId, isGranted: o.isGranted }));
    if (data.length > 0) {
      await this.prisma.userPermission.createMany({ data });
    }

    await this.prisma.auditLog.create({
      data: { userId: currentUser.id, action: 'USER_PERMISSION_OVERRIDE', entityType: 'User', entityId: userId }
    });

    return { message: 'User overrides updated successfully' };
  }

  // Evaluate Permission
  async checkPermission(userId: string, category: string, action: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
    if (!user) return false;

    // Admin bypass
    if (user.role.name === 'SystemAdmin') return true;

    const perm = await this.prisma.permission.findUnique({
      where: { category_action: { category, action } }
    });
    if (!perm) return false;

    // 1. Check User overrides
    const userOverride = await this.prisma.userPermission.findUnique({
      where: { userId_permissionId: { userId, permissionId: perm.id } }
    });

    if (userOverride) {
      return userOverride.isGranted; // Override applies explicitly (true or false)
    }

    // 2. Check Role
    const rolePerm = await this.prisma.rolePermission.findUnique({
      where: { roleId_permissionId: { roleId: user.roleId, permissionId: perm.id } }
    });

    return !!rolePerm; // Return true if role has it, else false
  }
}
