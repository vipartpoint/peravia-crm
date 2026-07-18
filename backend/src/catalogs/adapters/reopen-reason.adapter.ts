import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CatalogAdapter, PaginatedResult } from './catalog-adapter.interface';
import { IsString, IsBoolean, IsNumber, IsOptional, validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';

class ReopenReasonDto {
  @IsString() code: string;
  @IsString() nameEn: string;
  @IsString() nameFa: string;
  @IsString() @IsOptional() description?: string;
  @IsBoolean() @IsOptional() isActive?: boolean;
  @IsNumber() @IsOptional() sortOrder?: number;
}

class UpdateReopenReasonDto {
  @IsString() @IsOptional() code?: string;
  @IsString() @IsOptional() nameEn?: string;
  @IsString() @IsOptional() nameFa?: string;
  @IsString() @IsOptional() description?: string;
  @IsBoolean() @IsOptional() isActive?: boolean;
  @IsNumber() @IsOptional() sortOrder?: number;
}

export class ReopenReasonAdapter implements CatalogAdapter<any> {
  private allowedSortFields = ['code', 'nameFa', 'nameEn', 'sortOrder', 'isActive', 'createdAt'];

  async findAll(prisma: PrismaService, params: any): Promise<PaginatedResult<any>> {
    const page = params.page ? parseInt(params.page, 10) : 1;
    const pageSize = params.pageSize ? parseInt(params.pageSize, 10) : 20;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (params.activeOnly === 'true') where.isActive = true;
    if (params.search) {
      where.OR = [
        { code: { contains: params.search, mode: 'insensitive' } },
        { nameFa: { contains: params.search, mode: 'insensitive' } },
        { nameEn: { contains: params.search, mode: 'insensitive' } }
      ];
    }

    let orderBy = {};
    if (params.sortBy && this.allowedSortFields.includes(params.sortBy)) {
      orderBy = { [params.sortBy]: params.sortOrder === 'desc' ? 'desc' : 'asc' };
    } else {
      orderBy = { sortOrder: 'asc' };
    }

    const [total, data] = await Promise.all([
      prisma.reopenReason.count({ where }),
      prisma.reopenReason.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: { _count: { select: { opportunities: true } } }
      })
    ]);

    const mappedData = data.map(r => {
      const { _count, ...rest } = r;
      return { ...rest, usageCount: _count.opportunities };
    });

    return {
      data: mappedData,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  async findOne(prisma: PrismaService, id: string): Promise<any | null> {
    return prisma.reopenReason.findUnique({ where: { id } });
  }

  validateCreate(data: any): void {
    const dto = plainToInstance(ReopenReasonDto, data, { excludeExtraneousValues: false });
    const errors = validateSync(dto);
    if (errors.length > 0) throw new BadRequestException('Validation failed');
    const allowedKeys = ['code', 'nameEn', 'nameFa', 'description', 'isActive', 'sortOrder'];
    for (const key of Object.keys(data)) {
      if (!allowedKeys.includes(key)) throw new BadRequestException('Unknown property: ' + key);
    }
  }

  validateUpdate(data: any): void {
    const dto = plainToInstance(UpdateReopenReasonDto, data, { excludeExtraneousValues: false });
    const errors = validateSync(dto);
    if (errors.length > 0) throw new BadRequestException('Validation failed');
    const allowedKeys = ['code', 'nameEn', 'nameFa', 'description', 'isActive', 'sortOrder'];
    for (const key of Object.keys(data)) {
      if (!allowedKeys.includes(key)) throw new BadRequestException('Unknown property: ' + key);
    }
  }

  async create(prisma: PrismaService, data: any, userId: string): Promise<any> {
    this.validateCreate(data);
    const existing = await prisma.reopenReason.findUnique({ where: { code: data.code } });
    if (existing) throw new ConflictException('Code already exists');
    return prisma.reopenReason.create({ data });
  }

  async update(prisma: PrismaService, id: string, data: any, userId: string): Promise<any> {
    this.validateUpdate(data);
    const existing = await prisma.reopenReason.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Record not found');

    if (existing.isSystem) {
      if ('code' in data && data.code !== existing.code) throw new ForbiddenException('Cannot change code of a system record');
      if ('isActive' in data && data.isActive !== existing.isActive) throw new ForbiddenException('Cannot deactivate a system record');
      if ('isSystem' in data && data.isSystem !== existing.isSystem) throw new ForbiddenException('Cannot change isSystem flag');
    }

    if (data.code && data.code !== existing.code) {
      const dupe = await prisma.reopenReason.findUnique({ where: { code: data.code } });
      if (dupe) throw new ConflictException('Code already exists');
    }

    return prisma.reopenReason.update({ where: { id }, data });
  }

  async softDelete(prisma: PrismaService, id: string, userId: string): Promise<void> {
    const existing = await prisma.reopenReason.findUnique({
      where: { id },
      include: { _count: { select: { opportunities: true } } }
    });
    if (!existing) throw new NotFoundException('Record not found');
    if (existing.isSystem) throw new ForbiddenException('System records cannot be deleted');
    if (existing._count.opportunities > 0) throw new ConflictException('Record is in use and cannot be deleted');

    await prisma.reopenReason.update({ where: { id }, data: { isActive: false } });
  }
}
