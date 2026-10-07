import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTerritoryDto } from './dto/create-territory.dto';
import { UpdateTerritoryDto } from './dto/update-territory.dto';
import { HardDeleteTerritoryDto } from './dto/hard-delete-territory.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class TerritoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createTerritoryDto: CreateTerritoryDto, userId: string) {
    const existing = await this.prisma.territory.findUnique({
      where: { code: createTerritoryDto.code }
    });
    if (existing) {
      throw new BadRequestException('Territory code must be unique');
    }

    let managerIdToUse = createTerritoryDto.managerId;
    
    if (!managerIdToUse) {
      const adminRole = await this.prisma.role.findUnique({ where: { name: 'SystemAdmin' } });
      if (adminRole) {
        const adminUser = await this.prisma.user.findFirst({ where: { roleId: adminRole.id } });
        if (adminUser) {
          managerIdToUse = adminUser.id;
        }
      }
    }

    if (!managerIdToUse) {
      managerIdToUse = userId; // fallback to creator
    }

    const territory = await this.prisma.territory.create({
      data: {
        ...createTerritoryDto,
        managerId: managerIdToUse,
        createdBy: userId,
      },
    });

    await this.logAudit(userId, 'CREATE_TERRITORY', 'Territory', territory.id, null, territory);
    return territory;
  }

  async findAll(user: any) {
    let whereClause: any = { deletedAt: null };

    if (user.role.name === 'RegionalManager') {
      // Find territories where they are manager, or their children
      // Simple approach: get all and filter in memory if deeply nested, or query directly if depth is small
      // For simplicity in Prisma, we get all and build hierarchy or use basic recursive query
      const myManaged = await this.prisma.territory.findMany({
        where: { managerId: user.id, deletedAt: null }
      });
      const managedIds = myManaged.map(t => t.id);
      
      const allActive = await this.prisma.territory.findMany({ where: { deletedAt: null } });
      const visibleIds = new Set<string>(managedIds);
      
      const addChildren = (parentId: string) => {
        for (const t of allActive) {
          if (t.parentId === parentId && !visibleIds.has(t.id)) {
            visibleIds.add(t.id);
            addChildren(t.id);
          }
        }
      };
      
      for (const id of managedIds) {
        addChildren(id);
      }
      
      whereClause.id = { in: Array.from(visibleIds) };
    } else if (user.role.name === 'SalesRep') {
      // Find territories of assigned customers
      const customers = await this.prisma.customer.findMany({
        where: { assignedUserId: user.id },
        select: { territoryId: true }
      });
      const tIds = customers.map(c => c.territoryId).filter(id => id !== null) as string[];
      whereClause.id = { in: tIds };
    }

    return this.prisma.territory.findMany({
      where: whereClause,
      include: {
        parent: true,
        manager: {
          select: { id: true, username: true }
        },
        _count: {
          select: { customers: true, users: true, children: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string) {
    const territory = await this.prisma.territory.findUnique({
      where: { id },
      include: {
        parent: true,
        children: { where: { deletedAt: null } },
        manager: {
          select: { id: true, username: true }
        },
        _count: {
          select: { customers: { where: { deletedAt: null } } }
        }
      },
    });
    if (!territory || territory.deletedAt) {
      throw new NotFoundException(`Territory with ID ${id} not found`);
    }
    return territory;
  }

  async update(id: string, updateTerritoryDto: UpdateTerritoryDto, userId: string) {
    const territory = await this.findOne(id);

    if (updateTerritoryDto.code && updateTerritoryDto.code !== territory.code) {
      const existing = await this.prisma.territory.findUnique({ where: { code: updateTerritoryDto.code } });
      if (existing) throw new BadRequestException('Territory code must be unique');
    }

    const updated = await this.prisma.territory.update({
      where: { id },
      data: updateTerritoryDto,
    });

    await this.logAudit(userId, 'UPDATE_TERRITORY', 'Territory', id, territory, updated);
    
    if (updateTerritoryDto.managerId && updateTerritoryDto.managerId !== territory.managerId) {
      await this.logAudit(userId, 'ASSIGN_TERRITORY_MANAGER', 'Territory', id, { oldManager: territory.managerId }, { newManager: updateTerritoryDto.managerId });
    }

    return updated;
  }

  async remove(id: string, userId: string, reason?: string) {
    const territory = await this.findOne(id);
    
    // Check constraints
    if (territory.children.length > 0) {
      throw new BadRequestException('Cannot archive a territory that has active child territories.');
    }
    if (territory._count.customers > 0) {
      throw new BadRequestException('Cannot archive a territory that has active customers.');
    }

    const archived = await this.prisma.territory.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
        deleteReason: reason || 'No reason provided',
        isActive: false
      }
    });

    await this.logAudit(userId, 'ARCHIVE_TERRITORY', 'Territory', id, territory, archived);
    return archived;
  }

  async hardDeleteAndMerge(id: string, dto: HardDeleteTerritoryDto, userId: string) {
    // 1. Verify Admin PIN (Golden Key)
    const adminPinHash = process.env.ADMIN_PIN_HASH || '$2b$10$QGTXM9t9CK1Y2WCOWd7E2ek5ofwoJL70DzgkkKh/LN6GYelYjfecm';
    const envPin = process.env.ADMIN_PIN || '123456';
    const isValidPin = (dto.adminPin === envPin) || (await bcrypt.compare(dto.adminPin, adminPinHash).catch(() => false));
    if (!isValidPin) {
      throw new BadRequestException('رمز کلیدی نامعتبر است (Invalid Admin PIN)');
    }

    const territory = await this.prisma.territory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { customers: true, users: true, children: true, Lead: true, visits: true, orders: true, kpiTargets: true, opportunities: true }
        }
      }
    });

    if (!territory) {
      throw new NotFoundException('منطقه یافت نشد (Territory not found)');
    }

    const hasDependencies = 
      territory._count.customers > 0 || 
      territory._count.users > 0 || 
      territory._count.children > 0 || 
      territory._count.Lead > 0 || 
      territory._count.visits > 0 || 
      territory._count.orders > 0 || 
      territory._count.kpiTargets > 0 || 
      territory._count.opportunities > 0;

    const isDetachMode = dto.mode === 'detach' || (!dto.replacementTerritoryId && dto.mode !== 'merge');

    // 2. Merge or Detach if dependencies exist
    if (hasDependencies) {
      if (isDetachMode) {
        // Safe detachment: All records remain preserved in database with territoryId set to null (unassigned)
        await this.prisma.$transaction([
          this.prisma.customer.updateMany({ where: { territoryId: id }, data: { territoryId: null } }),
          this.prisma.lead.updateMany({ where: { territoryId: id }, data: { territoryId: null } }),
          this.prisma.visit.updateMany({ where: { territoryId: id }, data: { territoryId: null } }),
          this.prisma.order.updateMany({ where: { territoryId: id }, data: { territoryId: null } }),
          this.prisma.kPITarget.updateMany({ where: { territoryId: id }, data: { territoryId: null } }),
          this.prisma.opportunity.updateMany({ where: { territoryId: id }, data: { territoryId: null } }),
          this.prisma.user.updateMany({ where: { territoryId: id }, data: { territoryId: null } }),
          this.prisma.territory.updateMany({ where: { parentId: id }, data: { parentId: null } }),
        ]);
      } else {
        if (!dto.replacementTerritoryId) {
          throw new BadRequestException('برای ادغام منطقه، انتخاب منطقه جایگزین الزامی است، یا گزینه «تبدیل به بدون منطقه» را انتخاب کنید.');
        }

        if (id === dto.replacementTerritoryId) {
          throw new BadRequestException('منطقه جایگزین نمی‌تواند با منطقه فعلی یکسان باشد.');
        }

        const replacement = await this.prisma.territory.findUnique({ where: { id: dto.replacementTerritoryId } });
        if (!replacement) {
          throw new NotFoundException('منطقه جایگزین یافت نشد.');
        }

        // Execute massive reassignment in a transaction
        await this.prisma.$transaction([
          this.prisma.customer.updateMany({ where: { territoryId: id }, data: { territoryId: dto.replacementTerritoryId } }),
          this.prisma.lead.updateMany({ where: { territoryId: id }, data: { territoryId: dto.replacementTerritoryId } }),
          this.prisma.visit.updateMany({ where: { territoryId: id }, data: { territoryId: dto.replacementTerritoryId } }),
          this.prisma.order.updateMany({ where: { territoryId: id }, data: { territoryId: dto.replacementTerritoryId } }),
          this.prisma.kPITarget.updateMany({ where: { territoryId: id }, data: { territoryId: dto.replacementTerritoryId } }),
          this.prisma.opportunity.updateMany({ where: { territoryId: id }, data: { territoryId: dto.replacementTerritoryId } }),
          this.prisma.user.updateMany({ where: { territoryId: id }, data: { territoryId: dto.replacementTerritoryId } }),
          this.prisma.territory.updateMany({ where: { parentId: id }, data: { parentId: dto.replacementTerritoryId } }),
        ]);
      }
    }

    // 3. Physically delete the territory
    try {
      await this.prisma.territory.delete({ where: { id } });
    } catch (e: any) {
      throw new BadRequestException('امکان حذف فیزیکی وجود ندارد، هنوز رکوردهایی در دیتابیس به این منطقه متصل هستند.');
    }

    // 4. Log the destructive action
    await this.logAudit(
      userId, 
      isDetachMode ? 'HARD_DELETE_AND_DETACH_TERRITORY' : 'HARD_DELETE_AND_MERGE_TERRITORY', 
      'Territory', 
      id, 
      { name: territory.name, hasDependencies, mode: isDetachMode ? 'detach' : 'merge', mergedInto: dto.replacementTerritoryId || null }, 
      null
    );

    return { 
      message: isDetachMode 
        ? 'منطقه حذف گردید و تمام رکوردهای وابسته بدون حذف شدن، به وضعیت «بدون منطقه» تبدیل شدند.'
        : 'منطقه با موفقیت حذف و تمام رکوردها به منطقه جدید منتقل شدند.'
    };
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
