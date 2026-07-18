import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Roles('SystemAdmin', 'CEO', 'SalesManager', 'SalesRep')
  @RequirePermissions({ category: 'Orders', action: 'Create' })
  @Post()
  create(@Body() createOrderDto: CreateOrderDto, @Req() req: Request) {
    const user = req.user as any;
    return this.ordersService.create(createOrderDto, user);
  }

  @Roles('SystemAdmin', 'CEO', 'SalesManager', 'RegionalManager', 'SalesRep', 'Finance')
  @RequirePermissions({ category: 'Orders', action: 'View' })
  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as any;
    return this.ordersService.findAll(user);
  }

  @Roles('SystemAdmin', 'CEO', 'SalesManager', 'RegionalManager', 'SalesRep', 'Finance')
  @RequirePermissions({ category: 'Orders', action: 'View' })
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any;
    return this.ordersService.findOne(id, user);
  }

  @Roles('SystemAdmin', 'CEO', 'SalesManager', 'SalesRep', 'Finance')
  @RequirePermissions({ category: 'Orders', action: 'Edit' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto, @Req() req: Request) {
    const user = req.user as any;
    return this.ordersService.update(id, updateOrderDto, user);
  }

  @Roles('SystemAdmin', 'CEO', 'SalesManager')
  @RequirePermissions({ category: 'Orders', action: 'Delete' })
  @Delete(':id')
  remove(@Param('id') id: string, @Body('deleteReason') reason: string, @Req() req: Request) {
    const user = req.user as any;
    return this.ordersService.remove(id, user, reason);
  }
}
