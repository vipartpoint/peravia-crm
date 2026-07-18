import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  private calculateMargin(basePrice: number | undefined, estimatedCost: number | undefined): number {
    const price = basePrice || 0;
    const cost = estimatedCost || 0;
    if (price === 0) return 0;
    return ((price - cost) / price) * 100;
  }

  async create(createProductDto: CreateProductDto, userId: string) {
    const existing = await this.prisma.product.findUnique({
      where: { sku: createProductDto.sku }
    });
    if (existing) {
      throw new BadRequestException('Product SKU must be unique');
    }

    const margin = this.calculateMargin(createProductDto.basePrice, createProductDto.estimatedCost);

    const product = await this.prisma.product.create({
      data: {
        ...createProductDto,
        estimatedProfitMargin: margin,
        createdBy: userId,
      },
    });

    await this.logAudit(userId, 'CREATE_PRODUCT', 'Product', product.id, null, product);
    return product;
  }

  async findAll() {
    return this.prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });
    if (!product || product.deletedAt) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto, userId: string) {
    const product = await this.findOne(id);

    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const existing = await this.prisma.product.findUnique({ where: { sku: updateProductDto.sku } });
      if (existing) throw new BadRequestException('Product SKU must be unique');
    }

    const basePrice = updateProductDto.basePrice !== undefined ? updateProductDto.basePrice : Number(product.basePrice);
    const estimatedCost = updateProductDto.estimatedCost !== undefined ? updateProductDto.estimatedCost : Number(product.estimatedCost);
    const margin = this.calculateMargin(basePrice, estimatedCost);

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...updateProductDto,
        estimatedProfitMargin: margin
      },
    });

    await this.logAudit(userId, 'UPDATE_PRODUCT', 'Product', id, product, updated);
    
    if (updateProductDto.basePrice !== undefined && Number(updateProductDto.basePrice) !== Number(product.basePrice)) {
      await this.logAudit(userId, 'UPDATE_PRODUCT_PRICE', 'Product', id, { oldPrice: product.basePrice }, { newPrice: updateProductDto.basePrice });
    }

    return updated;
  }

  async remove(id: string, userId: string, reason?: string) {
    const product = await this.findOne(id);
    
    const activeOrderStatuses = ['Draft', 'PendingApproval', 'Approved', 'Delivered'];
    const activeOrders = await this.prisma.orderItem.count({
      where: {
        productId: id,
        order: {
          status: { in: activeOrderStatuses }
        }
      }
    });

    if (activeOrders > 0) {
      throw new BadRequestException('Cannot archive a product that exists in active orders.');
    }

    const archived = await this.prisma.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
        deleteReason: reason || 'No reason provided',
        isActive: false
      }
    });

    await this.logAudit(userId, 'ARCHIVE_PRODUCT', 'Product', id, product, archived);
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
