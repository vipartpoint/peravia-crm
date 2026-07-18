import { PrismaService } from '../../prisma/prisma.service';

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface CatalogAdapter<T> {
  findAll(
    prisma: PrismaService, 
    params: { search?: string, page?: number, pageSize?: number, sortBy?: string, sortOrder?: string, activeOnly?: boolean }
  ): Promise<PaginatedResult<T>>;
  
  findOne(prisma: PrismaService, id: string): Promise<T | null>;
  
  create(prisma: PrismaService, data: any, userId: string): Promise<T>;
  
  update(prisma: PrismaService, id: string, data: any, userId: string): Promise<T>;
  
  softDelete(prisma: PrismaService, id: string, userId: string): Promise<void>;
  
  validateCreate(data: any): void;
  
  validateUpdate(data: any): void;
}
