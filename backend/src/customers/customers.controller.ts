import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Roles('SystemAdmin', 'CEO', 'SalesManager', 'SalesRep')
  @RequirePermissions({ category: 'Customers', action: 'Create' })
  @Post()
  create(@Body() createCustomerDto: CreateCustomerDto, @Req() req: any) {
    return this.customersService.create(createCustomerDto, req.user.id);
  }

  @Roles('SystemAdmin', 'CEO', 'SalesManager', 'RegionalManager', 'SalesRep', 'Finance', 'SupportOperator')
  @RequirePermissions({ category: 'Customers', action: 'View' })
  @Get()
  findAll() {
    return this.customersService.findAll();
  }

  @Roles('SystemAdmin', 'CEO', 'SalesManager', 'RegionalManager', 'SalesRep', 'Finance', 'SupportOperator')
  @RequirePermissions({ category: 'Customers', action: 'View' })
  @Get(':id')
  findOne(@Param('id') id: string, @Query('revealSensitive') revealSensitive: string, @Req() req: any) {
    const shouldReveal = revealSensitive === 'true';
    return this.customersService.findOne(id, { revealSensitive: shouldReveal, user: req.user });
  }

  @Roles('SystemAdmin', 'CEO', 'SalesManager', 'SalesRep')
  @RequirePermissions({ category: 'Customers', action: 'Edit' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto, @Req() req: any) {
    return this.customersService.update(id, updateCustomerDto, req.user);
  }

  @Roles('SystemAdmin', 'CEO', 'SalesManager')
  @RequirePermissions({ category: 'Customers', action: 'Delete' })
  @Delete(':id')
  remove(@Param('id') id: string, @Body('reason') reason: string, @Req() req: any) {
    return this.customersService.remove(id, req.user, reason);
  }
}
