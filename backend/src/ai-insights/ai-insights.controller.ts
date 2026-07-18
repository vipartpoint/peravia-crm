import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { AiInsightsService } from './ai-insights.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai-insights')
export class AiInsightsController {
  constructor(private readonly aiInsightsService: AiInsightsService) {}

  @Post('recalculate')
  recalculate(@Req() req: Request) {
    return this.aiInsightsService.recalculate(req.user as any);
  }

  @Get()
  findAll(@Req() req: Request) {
    return this.aiInsightsService.findAll(req.user as any);
  }

  @Get('leads')
  findLeads(@Req() req: Request) {
    return this.aiInsightsService.findByGroup(req.user as any, 'leads');
  }

  @Get('customers')
  findCustomers(@Req() req: Request) {
    return this.aiInsightsService.findByGroup(req.user as any, 'customers');
  }

  @Get('manager')
  findManagerAlerts(@Req() req: Request) {
    return this.aiInsightsService.findByGroup(req.user as any, 'manager');
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string, @Req() req: Request) {
    return this.aiInsightsService.updateStatus(id, status, req.user as any);
  }
}
