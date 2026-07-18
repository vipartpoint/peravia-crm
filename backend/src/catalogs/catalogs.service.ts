import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdapterFactory } from './adapters/adapter.factory';
import { PaginatedResult } from './adapters/catalog-adapter.interface';
import { ActivitiesService } from '../activities/activities.service';

@Injectable()
export class CatalogsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activitiesService: ActivitiesService
  ) {}

  private getAdapterOrThrow(type: string) {
    const adapter = AdapterFactory.getAdapter(type);
    if (!adapter) {
      throw new NotFoundException(`Catalog type '${type}' is not supported.`);
    }
    return adapter;
  }

  async findAll(type: string, queryParams: any): Promise<PaginatedResult<any>> {
    const adapter = this.getAdapterOrThrow(type);
    return adapter.findAll(this.prisma, queryParams);
  }

  async findOne(type: string, id: string): Promise<any> {
    const adapter = this.getAdapterOrThrow(type);
    const item = await adapter.findOne(this.prisma, id);
    if (!item) throw new NotFoundException('Record not found');
    return item;
  }

  async create(type: string, data: any, userId: string): Promise<any> {
    const adapter = this.getAdapterOrThrow(type);
    const result = await adapter.create(this.prisma, data, userId);

    await this.activitiesService.logActivity({
      entityType: 'Catalog',
      entityId: result.id,
      activityType: 'CatalogItemCreated',
      title: `Added to ${type}`,
      description: `User created a new record in ${type}`,
      metadata: {
        catalogType: type,
        catalogItemId: result.id,
        action: 'CREATE',
        newValue: result,
        performedBy: userId,
        performedAt: new Date().toISOString()
      }
    }, userId);

    return result;
  }

  async update(type: string, id: string, data: any, userId: string): Promise<any> {
    const adapter = this.getAdapterOrThrow(type);
    const previousValue = await this.findOne(type, id);
    const result = await adapter.update(this.prisma, id, data, userId);

    await this.activitiesService.logActivity({
      entityType: 'Catalog',
      entityId: result.id,
      activityType: 'CatalogItemUpdated',
      title: `Updated in ${type}`,
      description: `User updated a record in ${type}`,
      metadata: {
        catalogType: type,
        catalogItemId: result.id,
        action: 'UPDATE',
        previousValue,
        newValue: result,
        performedBy: userId,
        performedAt: new Date().toISOString()
      }
    }, userId);

    return result;
  }

  async delete(type: string, id: string, userId: string): Promise<void> {
    const adapter = this.getAdapterOrThrow(type);
    const previousValue = await this.findOne(type, id);
    await adapter.softDelete(this.prisma, id, userId);

    await this.activitiesService.logActivity({
      entityType: 'Catalog',
      entityId: id,
      activityType: 'CatalogItemDeleted',
      title: `Soft-deleted in ${type}`,
      description: `User deleted a record in ${type}`,
      metadata: {
        catalogType: type,
        catalogItemId: id,
        action: 'DELETE',
        previousValue,
        performedBy: userId,
        performedAt: new Date().toISOString()
      }
    }, userId);
  }
}
