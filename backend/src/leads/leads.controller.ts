import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('leads')
export class LeadsController {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly prisma: PrismaService
  ) {}

  @Roles('SystemAdmin', 'CEO', 'SalesManager', 'SalesRep')
  @RequirePermissions({ category: 'Leads', action: 'Create' })
  @Post()
  create(@Body() createLeadDto: CreateLeadDto, @Req() req: Request) {
    const user = req.user as any;
    return this.leadsService.create(createLeadDto, user);
  }

  @Get('stages')
  async getStages() {
    return this.prisma.salesFunnelStage.findMany({ orderBy: { order: 'asc' } });
  }

  @Roles('SystemAdmin', 'CEO', 'SalesManager', 'RegionalManager', 'SalesRep')
  @RequirePermissions({ category: 'Leads', action: 'View' })
  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as any;
    return this.leadsService.findAll(user);
  }

  @Roles('SystemAdmin', 'CEO', 'SalesManager', 'RegionalManager', 'SalesRep')
  @RequirePermissions({ category: 'Leads', action: 'View' })
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any;
    return this.leadsService.findOne(id, user);
  }

  @Roles('SystemAdmin', 'CEO', 'SalesManager', 'RegionalManager', 'SalesRep', 'Finance')
  @RequirePermissions({ category: 'Leads', action: 'RevealSensitiveData' })
  @Post(':id/reveal-phone')
  revealPhone(@Param('id') id: string, @Body('isCall') isCall: boolean, @Req() req: Request) {
    const user = req.user as any;
    return this.leadsService.revealPhone(id, user, isCall);
  }

  @Roles('SystemAdmin', 'CEO', 'SalesManager', 'SalesRep')
  @RequirePermissions({ category: 'Leads', action: 'Edit' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLeadDto: UpdateLeadDto, @Req() req: Request) {
    const user = req.user as any;
    return this.leadsService.update(id, updateLeadDto, user);
  }

  @Roles('SystemAdmin', 'CEO', 'SalesManager', 'SalesRep')
  @RequirePermissions({ category: 'Leads', action: 'Edit' })
  @Post(':id/convert')
  convertToCustomer(@Param('id') id: string, @Body() customerData: any, @Req() req: Request) {
    const user = req.user as any;
    return this.leadsService.convertToCustomer(id, customerData, user);
  }

  @Roles('SystemAdmin', 'CEO', 'SalesManager')
  @RequirePermissions({ category: 'Leads', action: 'Delete' })
  @Delete(':id')
  remove(@Param('id') id: string, @Body('reason') reason: string, @Req() req: Request) {
    const user = req.user as any;
    return this.leadsService.remove(id, user, reason);
  }
}
