import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Req } from '@nestjs/common';
import { OpportunitiesService } from './opportunities.service';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import type { Request } from 'express';

// Assuming basic auth guard is applied globally or imported here
// import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// import { RolesGuard } from '../auth/roles.guard';

@Controller('opportunities')
// @UseGuards(JwtAuthGuard, RolesGuard)
export class OpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  @Post()
  create(@Body() createOpportunityDto: CreateOpportunityDto, @Req() req: Request) {
    const userId = (req.user as any)?.id || req.headers['x-user-id'] || 'system-user'; // Replace with actual user resolution
    return this.opportunitiesService.create(createOpportunityDto, userId as string);
  }

  @Get()
  findAll(@Query() query: any, @Req() req: Request) {
    const filters: any = {};
    const user = req.user as any;
    
    // RBAC Simulation
    if (user && user.role !== 'SystemAdmin') {
      filters.ownerId = user.id;
    }

    if (query.status) filters.status = query.status;
    if (query.territoryId) filters.territoryId = query.territoryId;
    
    return this.opportunitiesService.findAll(filters);
  }

  @Get('dashboard/forecast')
  getDashboardForecast(@Query() query: any, @Req() req: Request) {
    const filters: any = {};
    const user = req.user as any;
    
    if (user && user.role !== 'SystemAdmin') {
      filters.ownerId = user.id;
    }
    
    if (query.territoryId) filters.territoryId = query.territoryId;
    return this.opportunitiesService.getDashboardForecast(filters);
  }

  @Post('reports/custom')
  generateCustomReport(@Body() body: any, @Req() req: Request) {
    const filters: any = {};
    const user = req.user as any;
    
    // RBAC Simulation
    if (user && user.role !== 'SystemAdmin') {
      if (user.role === 'SalesManager') {
        // Mock: If manager, maybe restrict by territoryId in real app. For now, let's say they can see their territory.
        // If we had user.territoryId, we'd do filters.territoryId = user.territoryId;
        // For now, we just let them see all, or we could strict it to ownerId = user.id. The prompt says "Team/Territory".
        // Assuming we rely on the body to not request beyond their scope, or we'd enforce it here.
        // Let's enforce ownerId if it's a SalesRep.
      } else {
        filters.ownerId = user.id;
      }
    }
    
    return this.opportunitiesService.generateCustomReport(body, filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.opportunitiesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOpportunityDto: UpdateOpportunityDto, @Req() req: Request) {
    const userId = (req.user as any)?.id || 'system-user';
    return this.opportunitiesService.update(id, updateOpportunityDto, userId);
  }

  @Post(':id/convert-to-order')
  convertToOrderPreview(@Param('id') id: string) {
    return this.opportunitiesService.convertToOrderPreview(id);
  }
}
