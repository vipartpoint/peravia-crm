import { Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { KpiService } from './kpi.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('kpi')
export class KpiController {
  constructor(private readonly kpiService: KpiService) {}

  @Get()
  findAll(@Req() req: Request) {
    return this.kpiService.findAll(req.user);
  }

  @Post('recalculate')
  recalculate(@Req() req: Request) {
    return this.kpiService.recalculateAll(req.user);
  }
}
