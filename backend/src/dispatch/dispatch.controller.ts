import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { DispatchService } from './dispatch.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dispatch')
export class DispatchController {
  constructor(private readonly dispatchService: DispatchService) {}

  @Roles('SystemAdmin', 'CEO', 'WarehouseManager', 'WarehouseOperator', 'QC', 'FactoryManager', 'Security')
  @Get()
  getDispatchOrders(@Req() req: Request) {
    return this.dispatchService.getDispatchOrders(req.user);
  }

  @Roles('SystemAdmin', 'CEO', 'WarehouseManager', 'WarehouseOperator', 'QC', 'FactoryManager', 'Security')
  @Post(':id/advance')
  advanceDispatch(@Param('id') id: string, @Body('notes') notes: string, @Req() req: Request) {
    return this.dispatchService.advanceDispatch(id, req.user, notes);
  }

  @Roles('SystemAdmin', 'CEO', 'WarehouseManager', 'WarehouseOperator', 'QC', 'FactoryManager', 'Security')
  @Post(':id/reject')
  rejectDispatch(@Param('id') id: string, @Body('notes') notes: string, @Req() req: Request) {
    return this.dispatchService.rejectDispatch(id, req.user, notes);
  }
}
