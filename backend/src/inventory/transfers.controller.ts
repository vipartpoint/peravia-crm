import { Controller, Get, Post, Param, Body, UseGuards, Req, Query } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Roles('SystemAdmin', 'WarehouseManager', 'FactoryManager')
  @Post()
  create(@Body() data: any, @Req() req: Request) {
    return this.transfersService.create(data, (req.user as any).id);
  }

  @Roles('SystemAdmin', 'WarehouseManager', 'FactoryManager', 'CEO')
  @Get()
  findAll(@Query('status') status?: string) {
    return this.transfersService.findAll(status);
  }

  @Roles('SystemAdmin', 'WarehouseManager', 'FactoryManager')
  @Post(':id/submit')
  submitForApproval(@Param('id') id: string, @Req() req: Request) {
    return this.transfersService.submitForApproval(id, (req.user as any).id);
  }

  @Roles('SystemAdmin', 'WarehouseManager', 'FactoryManager')
  @Post(':id/approve')
  approve(@Param('id') id: string, @Req() req: Request) {
    return this.transfersService.approve(id, (req.user as any).id);
  }

  @Roles('SystemAdmin', 'WarehouseManager', 'FactoryManager')
  @Post(':id/complete')
  complete(@Param('id') id: string, @Req() req: Request) {
    return this.transfersService.complete(id, (req.user as any).id);
  }

  @Roles('SystemAdmin', 'WarehouseManager', 'FactoryManager')
  @Post(':id/reject')
  reject(@Param('id') id: string, @Body('notes') notes: string, @Req() req: Request) {
    return this.transfersService.reject(id, notes, (req.user as any).id);
  }
}
