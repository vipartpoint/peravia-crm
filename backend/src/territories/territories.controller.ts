import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { TerritoriesService } from './territories.service';
import { CreateTerritoryDto } from './dto/create-territory.dto';
import { UpdateTerritoryDto } from './dto/update-territory.dto';
import { HardDeleteTerritoryDto } from './dto/hard-delete-territory.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../permissions/guards/permissions.guard';
import { RequirePermissions } from '../permissions/decorators/permissions.decorator';
import type { Request } from 'express';

import { UpdateAdminPinDto } from './dto/update-admin-pin.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
@Controller('territories')
export class TerritoriesController {
  constructor(private readonly territoriesService: TerritoriesService) {}

  @Roles('SystemAdmin')
  @Get('admin-pin/status')
  getAdminPinStatus() {
    return this.territoriesService.getAdminPinStatus();
  }

  @Roles('SystemAdmin')
  @Post('admin-pin')
  updateAdminPin(@Body() dto: UpdateAdminPinDto, @Req() req: Request) {
    const user = req.user as any;
    return this.territoriesService.updateAdminPin(dto.currentPin, dto.newPin, user.id);
  }

  @RequirePermissions({ category: 'Territories', action: 'Create' })
  @Post()
  create(@Body() createTerritoryDto: CreateTerritoryDto, @Req() req: Request) {
    const user = req.user as any;
    return this.territoriesService.create(createTerritoryDto, user.id);
  }

  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as any;
    return this.territoriesService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.territoriesService.findOne(id);
  }

  @RequirePermissions({ category: 'Territories', action: 'Edit' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTerritoryDto: UpdateTerritoryDto, @Req() req: Request) {
    const user = req.user as any;
    return this.territoriesService.update(id, updateTerritoryDto, user.id);
  }

  @RequirePermissions({ category: 'Territories', action: 'Delete' })
  @Delete(':id')
  remove(@Param('id') id: string, @Body('deleteReason') reason: string, @Req() req: Request) {
    const user = req.user as any;
    return this.territoriesService.remove(id, user.id, reason);
  }

  @RequirePermissions({ category: 'Territories', action: 'Delete' })
  @Delete(':id/hard')
  hardDelete(
    @Param('id') id: string,
    @Body() hardDeleteDto: HardDeleteTerritoryDto,
    @Req() req: Request
  ) {
    const user = req.user as any;
    return this.territoriesService.hardDeleteAndMerge(id, hardDeleteDto, user.id);
  }
}

