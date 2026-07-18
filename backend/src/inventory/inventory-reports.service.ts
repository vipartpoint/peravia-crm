import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardSummary(warehouseId?: string) {
    const whereCondition = warehouseId ? { warehouseId } : {};
    const stocks = await this.prisma.inventoryStock.findMany({
      where: whereCondition,
      include: { product: true }
    });

    let totalReal = 0;
    let totalReserved = 0;
    let totalAvailable = 0;

    const byCategory: Record<string, number> = {};

    for (const s of stocks) {
      const real = Number(s.quantityOnHand);
      const reserved = Number(s.reservedQuantity);
      const available = Number(s.availableQuantity);
      
      totalReal += real;
      totalReserved += reserved;
      totalAvailable += available;

      const cat = s.product.inventoryCategory || 'Uncategorized';
      if (!byCategory[cat]) byCategory[cat] = 0;
      byCategory[cat] += real;
    }

    const returnsAndWaste = await this.prisma.stockMovement.groupBy({
      by: ['movementType'],
      where: { 
        movementType: { in: ['Return', 'Waste'] },
        ...whereCondition 
      },
      _sum: { quantity: true }
    });

    const totalReturns = returnsAndWaste.find(r => r.movementType === 'Return')?._sum.quantity || 0;
    const totalWaste = returnsAndWaste.find(r => r.movementType === 'Waste')?._sum.quantity || 0;

    return {
      totalReal,
      totalReserved,
      totalAvailable,
      byCategory,
      totalReturns,
      totalWaste
    };
  }

  async getCategoryReport(category: string, warehouseId?: string) {
    const whereCondition = warehouseId ? { warehouseId } : {};
    return this.prisma.inventoryStock.findMany({
      where: { 
        ...whereCondition,
        product: { inventoryCategory: category } 
      },
      include: { product: true }
    });
  }

  async getBatchStockLevels(warehouseId?: string) {
    const whereCondition = warehouseId ? { warehouseId } : {};
    return this.prisma.inventoryStock.findMany({
      where: {
        ...whereCondition,
        batchId: { not: null }
      },
      include: {
        product: { select: { name: true, sku: true, category: true } }
      }
    });
  }

  async getBatchReport() {
    return this.prisma.productionBatch.findMany({
      include: {
        product: { select: { name: true, sku: true } },
        _count: { select: { stocks: true, movements: true } }
      },
      orderBy: { productionDate: 'desc' }
    });
  }
}
