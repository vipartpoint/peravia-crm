import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTerritoryDto } from './dto/create-territory.dto';
import { UpdateTerritoryDto } from './dto/update-territory.dto';

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

    const territory = await this.prisma.territory.create({
      data: {
        ...createTerritoryDto,
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
