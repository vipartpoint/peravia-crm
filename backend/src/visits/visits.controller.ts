import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { VisitsService } from './visits.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('visits')
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Post()
  create(@Body() createVisitDto: CreateVisitDto, @Req() req: Request) {
    const user = req.user as any;
    return this.visitsService.create(createVisitDto, user);
  }

  @Get('today')
  getTodayVisits(@Req() req: Request) {
    return this.visitsService.getTodayVisits(req.user as any);
  }

  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as any;
    return this.visitsService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.visitsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVisitDto: UpdateVisitDto, @Req() req: Request) {
    const user = req.user as any;
    return this.visitsService.update(id, updateVisitDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any;
    return this.visitsService.remove(id, user);
  }
}
