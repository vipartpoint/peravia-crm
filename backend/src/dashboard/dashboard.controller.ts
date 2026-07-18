import { Controller, Get, UseGuards, Req, Query, BadRequestException } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  private parseDates(startDate?: string, endDate?: string) {
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    if (start > end) {
      throw new BadRequestException('startDate cannot be after endDate');
    }

    return { startDate: start, endDate: end };
  }

  @Get('overview')
  getOverview(@Req() req: Request, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    const dates = this.parseDates(startDate, endDate);
    return this.dashboardService.getOverview(req.user as any, dates.startDate, dates.endDate);
  }

  @Get('funnel')
  getFunnel(@Req() req: Request, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    const dates = this.parseDates(startDate, endDate);
    return this.dashboardService.getFunnel(req.user as any, dates.startDate, dates.endDate);
  }

  @Get('sales')
  getSalesAnalytics(@Req() req: Request, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    const dates = this.parseDates(startDate, endDate);
    return this.dashboardService.getSalesAnalytics(req.user as any, dates.startDate, dates.endDate);
  }

  @Get('followups')
  getFollowups(@Req() req: Request, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    const dates = this.parseDates(startDate, endDate);
    return this.dashboardService.getFollowups(req.user as any, dates.startDate, dates.endDate);
  }

  @Get('insights')
  getInsights(@Req() req: Request, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    const dates = this.parseDates(startDate, endDate);
    return this.dashboardService.getInsights(req.user as any, dates.startDate, dates.endDate);
  }
}
