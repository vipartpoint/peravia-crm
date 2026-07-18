import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CatalogAdapter, PaginatedResult } from './catalog-adapter.interface';
import { IsString, IsBoolean, IsOptional, validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';

class CompetitorDto {
  @IsString() name: string;
  @IsString() @IsOptional() website?: string;
  @IsString() @IsOptional() notes?: string;
  @IsBoolean() @IsOptional() isActive?: boolean;
}

class UpdateCompetitorDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() website?: string;
  @IsString() @IsOptional() notes?: string;
  @IsBoolean() @IsOptional() isActive?: boolean;
}

export class CompetitorAdapter implements CatalogAdapter<any> {
  private allowedSortFields = ['name', 'website', 'isActive', 'createdAt'];

  async findAll(prisma: PrismaService, params: any): Promise<PaginatedResult<any>> {
    const page = params.page ? parseInt(params.page, 10) : 1;
    const pageSize = params.pageSize ? parseInt(params.pageSize, 10) : 20;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (params.activeOnly === 'true') where.isActive = true;
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { website: { contains: params.search, mode: 'insensitive' } }
      ];
    }

    let orderBy = {};
    if (params.sortBy && this.allowedSortFields.includes(params.sortBy)) {
      orderBy = { [params.sortBy]: params.sortOrder === 'desc' ? 'desc' : 'asc' };
    } else {
      orderBy = { name: 'asc' };
    }

    const [total, data] = await Promise.all([
      prisma.competitor.count({ where }),
      prisma.competitor.findMany({
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
    return prisma.competitor.findUnique({ where: { id } });
  }

  validateCreate(data: any): void {
    const dto = plainToInstance(CompetitorDto, data, { excludeExtraneousValues: false });
    const errors = validateSync(dto);
    if (errors.length > 0) throw new BadRequestException('Validation failed');
    const allowedKeys = ['name', 'website', 'notes', 'isActive'];
    for (const key of Object.keys(data)) {
      if (!allowedKeys.includes(key)) throw new BadRequestException('Unknown property: ' + key);
    }
  }

  validateUpdate(data: any): void {
    const dto = plainToInstance(UpdateCompetitorDto, data, { excludeExtraneousValues: false });
    const errors = validateSync(dto);
    if (errors.length > 0) throw new BadRequestException('Validation failed');
    const allowedKeys = ['name', 'website', 'notes', 'isActive'];
    for (const key of Object.keys(data)) {
      if (!allowedKeys.includes(key)) throw new BadRequestException('Unknown property: ' + key);
    }
  }

  async create(prisma: PrismaService, data: any, userId: string): Promise<any> {
    this.validateCreate(data);
    const existing = await prisma.competitor.findUnique({ where: { name: data.name } });
    if (existing) throw new ConflictException('Competitor name already exists');
    return prisma.competitor.create({ data });
  }

  async update(prisma: PrismaService, id: string, data: any, userId: string): Promise<any> {
    this.validateUpdate(data);
    const existing = await prisma.competitor.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Record not found');

    if (data.name && data.name !== existing.name) {
      const dupe = await prisma.competitor.findUnique({ where: { name: data.name } });
      if (dupe) throw new ConflictException('Competitor name already exists');
    }

    return prisma.competitor.update({ where: { id }, data });
  }

  async softDelete(prisma: PrismaService, id: string, userId: string): Promise<void> {
    const existing = await prisma.competitor.findUnique({
      where: { id },
      include: { _count: { select: { opportunities: true } } }
    });
    if (!existing) throw new NotFoundException('Record not found');
    if (existing._count.opportunities > 0) throw new ConflictException('Record is in use and cannot be deleted');

    await prisma.competitor.update({ where: { id }, data: { isActive: false } });
  }
}
