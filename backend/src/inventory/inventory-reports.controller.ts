import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { InventoryReportsService } from './inventory-reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory-reports')
export class InventoryReportsController {
  constructor(private readonly reportsService: InventoryReportsService) {}

  @Roles('SystemAdmin', 'CEO', 'WarehouseManager', 'ProductionManager', 'Finance')
  @Get('summary')
  async getSummary(@Query('warehouseId') warehouseId?: string) {
    return this.reportsService.getDashboardSummary(warehouseId);
  }

  @Roles('SystemAdmin', 'CEO', 'WarehouseManager')
  @Get('category')
  getCategoryReport(@Query('category') category: string) {
    return this.reportsService.getCategoryReport(category);
  }

  @RequirePermissions({ category: 'Inventory', action: 'View' })
  @Get('batches')
  async getBatches(@Query('warehouseId') warehouseId?: string) {
    return this.reportsService.getBatchStockLevels(warehouseId);
  }
}
