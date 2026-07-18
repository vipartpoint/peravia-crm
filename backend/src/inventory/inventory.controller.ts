import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/guards/permissions.guard';
import { RequirePermissions } from '../permissions/decorators/permissions.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @RequirePermissions({ category: 'Inventory', action: 'View' })
  @Get('stocks')
  getStocks(@Query('warehouseId') warehouseId?: string, @Query('productId') productId?: string) {
    const filters: any = {};
    if (warehouseId) filters.warehouseId = warehouseId;
    if (productId) filters.productId = productId;
    return this.inventoryService.getStocks(filters);
  }

  @RequirePermissions({ category: 'Inventory', action: 'View' })
  @Get('alerts')
  getAlerts() {
    return this.inventoryService.getAlerts();
  }

  @RequirePermissions({ category: 'Inventory', action: 'ViewMovements' })
  @Get('movements')
  getMovements(@Query('warehouseId') warehouseId?: string, @Query('productId') productId?: string) {
    const filters: any = {};
    if (warehouseId) filters.warehouseId = warehouseId;
    if (productId) filters.productId = productId;
    return this.inventoryService.getMovements(filters);
  }

  @RequirePermissions({ category: 'Inventory', action: 'Adjust' })
  @Post('adjust')
  adjustStock(@Body() data: any, @Req() req: Request) {
    return this.inventoryService.adjustStock(data, (req.user as any).id);
  }

  @Roles('SystemAdmin', 'QC', 'WarehouseManager')
  @Post('return')
  processReturn(@Body() data: { warehouseId: string; productId: string; quantity: number; condition: 'Sellable' | 'Waste'; orderId: string }, @Req() req: Request) {
    return this.inventoryService.processReturn(data.warehouseId, data.productId, data.quantity, data.condition, data.orderId, (req.user as any).id);
  }
}
