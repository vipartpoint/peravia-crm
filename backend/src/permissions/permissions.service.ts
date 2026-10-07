import { Injectable, ForbiddenException, BadRequestException, ConflictException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PermissionsService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await this.ensureAllPermissionsSeeded();
    } catch (e) {
      console.error('Failed to seed permissions on module init:', e);
    }
  }

  async ensureAllPermissionsSeeded() {
    const categoriesWithActions: Record<string, string[]> = {
      Users: ['View', 'Create', 'Edit', 'Delete', 'Manage'],
      Roles: ['View', 'Create', 'Edit', 'Delete', 'Manage'],
      Security: ['View', 'Create', 'Edit', 'Delete', 'Manage', 'ManageSessions', 'ViewAuditLogs'],
      Settings: ['View', 'Create', 'Edit', 'Delete', 'Manage'],
      CustomerTiers: ['View', 'Create', 'Edit', 'Delete', 'Manage'],
      Customers: ['View', 'Create', 'Edit', 'Delete', 'Export', 'RevealSensitiveData', 'Manage'],
      Contacts: ['View', 'Create', 'Edit', 'Delete', 'Manage'],
      Leads: ['View', 'Create', 'Edit', 'Delete', 'Export', 'RevealSensitiveData', 'Manage'],
      Opportunities: ['View', 'Create', 'Edit', 'Delete', 'Export', 'Manage'],
      Presentations: ['View', 'Create', 'Edit', 'Delete', 'Manage'],
      Visits: ['View', 'Create', 'Edit', 'Delete', 'Manage'],
      Territories: ['View', 'Create', 'Edit', 'Delete', 'Manage'],
      Orders: ['View', 'Create', 'Edit', 'Delete', 'Export', 'Manage'],
      Payments: ['View', 'Create', 'Edit', 'Delete', 'Export', 'RevealSensitiveData', 'Manage'],
      Cheques: ['View', 'Create', 'Edit', 'Delete', 'Export', 'RevealSensitiveData', 'Manage'],
      Receivables: ['View', 'Create', 'Edit', 'Delete', 'Export', 'RevealSensitiveData', 'Manage'],
      Products: ['View', 'Create', 'Edit', 'Delete', 'Export', 'Manage'],
      PriceLists: ['View', 'Create', 'Edit', 'Delete', 'Export', 'Manage'],
      Warehouses: ['View', 'Create', 'Edit', 'Delete', 'Manage'],
      Inventory: ['View', 'Create', 'Edit', 'Delete', 'Adjust', 'ViewMovements', 'Manage'],
      KPIs: ['View', 'Create', 'Edit', 'Delete', 'Manage'],
      Commissions: ['View', 'Create', 'Edit', 'Delete', 'Manage'],
      Reports: ['View', 'Export', 'RevealSensitiveData', 'Manage'],
      FinancialReports: ['View', 'Export', 'RevealSensitiveData', 'Manage'],
      Tasks: ['View', 'Create', 'Edit', 'Delete', 'Manage'],
      Approvals: ['View', 'Create', 'Edit', 'Delete', 'Manage'],
      StockCertificates: ['View', 'Create', 'Edit', 'Delete', 'Export', 'Manage'],
      Loyalty: ['View', 'Create', 'Edit', 'Delete', 'Manage'],
      ContentCalendar: ['View', 'Create', 'Edit', 'Delete', 'Manage'],
      AiAssistant: ['View', 'Manage'],
    };

    const adminRole = await this.prisma.role.findUnique({ where: { name: 'SystemAdmin' } });

    for (const [cat, actions] of Object.entries(categoriesWithActions)) {
      for (const act of actions) {
        const perm = await this.prisma.permission.upsert({
          where: { category_action: { category: cat, action: act } },
          update: {},
          create: { category: cat, action: act }
        });

        if (adminRole) {
          await this.prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
            update: {},
            create: { roleId: adminRole.id, permissionId: perm.id }
          });
        }
      }
    }
  }

  async createRole(name: string, currentUser: any) {
    console.log("CURRENT USER: ", JSON.stringify(currentUser)); const roleName = typeof currentUser.role === 'string' ? currentUser.role : currentUser.role?.name;
    if (!['SystemAdmin', 'CompanyAdmin'].includes(roleName)) {
      if (currentUser.isImpersonated) {
        throw new ForbiddenException('شما در حالت ورود به جای کاربر دیگری هستید. ابتدا از حساب او خارج شوید.');
      }
      throw new ForbiddenException('فقط مدیر کل یا ادمین شرکت امکان تعریف نقش جدید را دارد');
    }
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new BadRequestException('نام نقش الزامی است');
    }

    const trimmedName = name.trim();
    const existing = await this.prisma.role.findUnique({ where: { name: trimmedName } });
    if (existing) throw new ConflictException('نقش با این نام از قبل وجود دارد');

    const role = await this.prisma.role.create({
      data: { name: trimmedName }
    });

    await this.prisma.auditLog.create({
      data: { userId: currentUser.id, action: 'CREATE_ROLE', entityType: 'Role', entityId: role.id }
    });

    return role;
  }

  async getAllPermissions() {
    await this.ensureAllPermissionsSeeded();
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
    console.log("CURRENT USER: ", JSON.stringify(currentUser)); const roleName = typeof currentUser.role === 'string' ? currentUser.role : currentUser.role?.name;
    if (!['SystemAdmin', 'CompanyAdmin'].includes(roleName)) {
      if (currentUser.isImpersonated) {
        throw new ForbiddenException('شما در حالت ورود به جای کاربر دیگری هستید. ابتدا از حساب او خارج شوید.');
      }
      throw new ForbiddenException('شما دسترسی لازم برای تغییر سطوح دسترسی را ندارید.');
    }

    const uniqueIds = Array.isArray(permissionIds) ? Array.from(new Set(permissionIds.filter(id => typeof id === 'string' && id.length > 0))) : [];

    await this.prisma.rolePermission.deleteMany({ where: { roleId } });
    
    const data = uniqueIds.map(pid => ({ roleId, permissionId: pid }));
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
    console.log("CURRENT USER: ", JSON.stringify(currentUser)); const roleName = typeof currentUser.role === 'string' ? currentUser.role : currentUser.role?.name;
    if (!['SystemAdmin', 'CompanyAdmin'].includes(roleName)) {
      if (currentUser.isImpersonated) {
        throw new ForbiddenException('شما در حالت ورود به جای کاربر دیگری هستید. ابتدا از حساب او خارج شوید.');
      }
      throw new ForbiddenException('شما دسترسی لازم برای تغییر سطوح دسترسی را ندارید.');
    }

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

    // SystemAdmin bypass only
    if (user.role.name === 'SystemAdmin') return true;

    const perm = await this.prisma.permission.findUnique({
      where: { category_action: { category, action } }
    });
    if (!perm) return false;

    // 1. Check User overrides for specific action
    const userOverride = await this.prisma.userPermission.findUnique({
      where: { userId_permissionId: { userId, permissionId: perm.id } }
    });

    if (userOverride) {
      return userOverride.isGranted; // Override applies explicitly (true or false)
    }

    // 2. Check if user has User override for 'Manage' in same category
    if (action !== 'Manage') {
      const managePerm = await this.prisma.permission.findUnique({
        where: { category_action: { category, action: 'Manage' } }
      });
      if (managePerm) {
        const userManageOverride = await this.prisma.userPermission.findUnique({
          where: { userId_permissionId: { userId, permissionId: managePerm.id } }
        });
        if (userManageOverride && userManageOverride.isGranted) {
          return true;
        }
      }
    }

    // 3. Check Role for specific action
    const rolePerm = await this.prisma.rolePermission.findUnique({
      where: { roleId_permissionId: { roleId: user.roleId, permissionId: perm.id } }
    });

    if (rolePerm) return true;

    // 4. Check Role for 'Manage' in same category
    if (action !== 'Manage') {
      const managePerm = await this.prisma.permission.findUnique({
        where: { category_action: { category, action: 'Manage' } }
      });
      if (managePerm) {
        const roleManagePerm = await this.prisma.rolePermission.findUnique({
          where: { roleId_permissionId: { roleId: user.roleId, permissionId: managePerm.id } }
        });
        if (roleManagePerm) return true;
      }
    }

    return false;
  }
}
