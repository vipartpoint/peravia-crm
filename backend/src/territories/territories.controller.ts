import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { TerritoriesService } from './territories.service';
import { CreateTerritoryDto } from './dto/create-territory.dto';
import { UpdateTerritoryDto } from './dto/update-territory.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('territories')
export class TerritoriesController {
  constructor(private readonly territoriesService: TerritoriesService) {}

  @Roles('SystemAdmin', 'CEO', 'SalesManager')
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

  @Roles('SystemAdmin', 'CEO', 'SalesManager')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTerritoryDto: UpdateTerritoryDto, @Req() req: Request) {
    const user = req.user as any;
    return this.territoriesService.update(id, updateTerritoryDto, user.id);
  }

  @Roles('SystemAdmin', 'CEO', 'SalesManager')
  @Delete(':id')
  remove(@Param('id') id: string, @Body('deleteReason') reason: string, @Req() req: Request) {
    const user = req.user as any;
    return this.territoriesService.remove(id, user.id, reason);
  }
}
