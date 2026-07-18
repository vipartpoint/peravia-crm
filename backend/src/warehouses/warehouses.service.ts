import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WarehousesService {
  constructor(private prisma: PrismaService) {}

  async create(data: any, userId: string) {
    const warehouse = await this.prisma.warehouse.create({
      data: {
        name: data.name,
        code: data.code,
        type: data.type || 'CentralWarehouse',
        managerId: data.managerId || null,
        location: data.location,
        isActive: data.isActive !== false,
        createdBy: userId,
      }
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE_WAREHOUSE',
        entityType: 'Warehouse',
        entityId: warehouse.id,
        newValue: warehouse as any,
      }
    });

    return warehouse;
  }

  async findAll(includeInactive: boolean = false) {
    return this.prisma.warehouse.findMany({
      where: includeInactive ? { deletedAt: null } : { isActive: true, deletedAt: null },
      include: { manager: { select: { id: true, username: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findById(id: string) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id, deletedAt: null },
      include: { manager: { select: { id: true, username: true } } }
    });
    if (!warehouse) throw new NotFoundException('Warehouse not found');
    return warehouse;
  }

  async update(id: string, data: any, userId: string) {
    const existing = await this.prisma.warehouse.findUnique({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Warehouse not found');

    const warehouse = await this.prisma.warehouse.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        code: data.code !== undefined ? data.code : undefined,
        type: data.type !== undefined ? data.type : undefined,
        managerId: data.managerId !== undefined ? data.managerId : undefined,
        location: data.location !== undefined ? data.location : undefined,
        isActive: data.isActive !== undefined ? data.isActive : undefined,
      }
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE_WAREHOUSE',
        entityType: 'Warehouse',
        entityId: warehouse.id,
        oldValue: existing as any,
        newValue: warehouse as any,
      }
    });

    return warehouse;
  }

  async archive(id: string, deleteReason: string, userId: string) {
    const warehouse = await this.prisma.warehouse.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
        deleteReason,
        isActive: false
      }
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'ARCHIVE_WAREHOUSE',
        entityType: 'Warehouse',
        entityId: warehouse.id,
        newValue: warehouse as any,
      }
    });

    return warehouse;
  }
}
