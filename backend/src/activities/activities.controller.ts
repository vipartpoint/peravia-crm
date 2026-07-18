import { Controller, Get, Post, Body, Param, Query, Req, UnauthorizedException } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import type { Request } from 'express';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get('entity/:entityType/:entityId')
  async getEntityActivities(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Req() req: Request
  ) {
    const user = req.user as any;
    const userId = user?.id || 'system-user';
    const role = user?.role || 'SystemAdmin';
    return this.activitiesService.getEntityActivities(entityType, entityId, userId, role);
  }

  @Get('recent')
  async getRecentActivities(@Query() query: any, @Req() req: Request) {
    const user = req.user as any;
    const userId = user?.id || 'system-user';
    const role = user?.role || 'SystemAdmin';
    return this.activitiesService.getRecentActivities(userId, role, query);
  }

  @Post('note')
  async addNote(@Body() body: any, @Req() req: Request) {
    const user = req.user as any;
    const userId = user?.id;
    if (!userId) {
      throw new UnauthorizedException('User must be authenticated to add notes.');
    }
    
    return this.activitiesService.logActivity({
      entityType: body.entityType,
      entityId: body.entityId,
      activityType: 'NoteAdded',
      title: 'یادداشت جدید',
      description: body.description,
      visibility: body.visibility || 'Internal'
    }, userId);
  }

  @Post('custom')
  async addCustomActivity(@Body() body: any, @Req() req: Request) {
    const user = req.user as any;
    const userId = user?.id || 'system-user';
    
    return this.activitiesService.logActivity({
      entityType: body.entityType,
      entityId: body.entityId,
      activityType: 'Custom',
      title: body.title,
      description: body.description,
      metadata: body.metadata,
      visibility: body.visibility || 'Internal'
    }, userId);
  }
}
