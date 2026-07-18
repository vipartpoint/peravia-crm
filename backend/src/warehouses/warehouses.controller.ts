import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { WarehousesService } from './warehouses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/guards/permissions.guard';
import { RequirePermissions } from '../permissions/decorators/permissions.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Roles('SystemAdmin', 'WarehouseManager', 'FactoryManager')
  @RequirePermissions({ category: 'Warehouses', action: 'Create' })
  @Post()
  create(@Body() data: any, @Req() req: Request) {
    return this.warehousesService.create(data, (req.user as any).id);
  }

  @Roles('SystemAdmin', 'CEO', 'WarehouseManager', 'FactoryManager', 'SalesRep', 'Finance')
  @RequirePermissions({ category: 'Warehouses', action: 'View' })
  @Get()
  findAll(@Query('all') all?: string) {
    return this.warehousesService.findAll(all === 'true');
  }

  @Roles('SystemAdmin', 'CEO', 'WarehouseManager', 'FactoryManager', 'SalesRep', 'Finance')
  @RequirePermissions({ category: 'Warehouses', action: 'View' })
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.warehousesService.findById(id);
  }

  @Roles('SystemAdmin', 'WarehouseManager', 'FactoryManager')
  @RequirePermissions({ category: 'Warehouses', action: 'Edit' })
  @Put(':id')
  update(@Param('id') id: string, @Body() data: any, @Req() req: Request) {
    return this.warehousesService.update(id, data, (req.user as any).id);
  }

  @Roles('SystemAdmin', 'WarehouseManager', 'FactoryManager')
  @RequirePermissions({ category: 'Warehouses', action: 'Edit' })
  @Post(':id/activate')
  activate(@Param('id') id: string, @Req() req: Request) {
    return this.warehousesService.update(id, { isActive: true }, (req.user as any).id);
  }

  @Roles('SystemAdmin', 'WarehouseManager', 'FactoryManager')
  @RequirePermissions({ category: 'Warehouses', action: 'Edit' })
  @Post(':id/deactivate')
  deactivate(@Param('id') id: string, @Req() req: Request) {
    return this.warehousesService.update(id, { isActive: false }, (req.user as any).id);
  }

  @Roles('SystemAdmin', 'WarehouseManager', 'FactoryManager')
  @RequirePermissions({ category: 'Warehouses', action: 'Delete' })
  @Delete(':id')
  archive(@Param('id') id: string, @Body('reason') reason: string, @Req() req: Request) {
    return this.warehousesService.archive(id, reason, (req.user as any).id);
  }
}
