import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(@Req() req: Request) {
    return this.notificationsService.findAll((req.user as any).id);
  }

  @Get('unread-count')
  getUnreadCount(@Req() req: Request) {
    return this.notificationsService.getUnreadCount((req.user as any).id);
  }

  @Patch('read-all')
  markAllAsRead(@Req() req: Request) {
    return this.notificationsService.markAllAsRead((req.user as any).id);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Req() req: Request) {
    return this.notificationsService.markAsRead(id, (req.user as any).id);
  }

  @Get('preferences')
  getPreferences(@Req() req: Request) {
    return this.notificationsService.getPreferences((req.user as any).id);
  }

  @Patch('preferences')
  updatePreferences(@Body() data: any, @Req() req: Request) {
    return this.notificationsService.updatePreferences((req.user as any).id, data);
  }

  // --- Admin Endpoints ---

  @UseGuards(RolesGuard)
  @Roles('SystemAdmin')
  @Get('templates')
  getTemplates() {
    return this.notificationsService.getTemplates();
  }

  @UseGuards(RolesGuard)
  @Roles('SystemAdmin', 'Finance', 'WarehouseManager', 'FactoryManager')
  @Get('logs')
  getLogs(@Query() query: any) {
    return this.notificationsService.getLogs(query);
  }

  @UseGuards(RolesGuard)
  @Roles('SystemAdmin')
  @Post('test-sms')
  testSms(@Body() body: any) {
    return this.notificationsService.testSms(body.recipient);
  }

  @UseGuards(RolesGuard)
  @Roles('SystemAdmin')
  @Patch('templates/:id')
  updateTemplate(@Param('id') id: string, @Body() data: any) {
    return this.notificationsService.updateTemplate(id, data);
  }

  // --- SMS Provider Management ---

  @UseGuards(RolesGuard)
  @Roles('SystemAdmin', 'Finance', 'WarehouseManager', 'FactoryManager')
  @Get('providers')
  getSmsProviders() {
    return this.notificationsService.getSmsProviders();
  }

  @UseGuards(RolesGuard)
  @Roles('SystemAdmin')
  @Post('providers')
  createSmsProvider(@Body() data: any, @Req() req: Request) {
    return this.notificationsService.createSmsProvider((req.user as any).id, data);
  }

  @UseGuards(RolesGuard)
  @Roles('SystemAdmin')
  @Patch('providers/:id')
  updateSmsProvider(@Param('id') id: string, @Body() data: any, @Req() req: Request) {
    return this.notificationsService.updateSmsProvider(id, (req.user as any).id, data);
  }

  @UseGuards(RolesGuard)
  @Roles('SystemAdmin')
  @Patch('providers/:id/activate')
  activateSmsProvider(@Param('id') id: string, @Req() req: Request) {
    return this.notificationsService.activateSmsProvider(id, (req.user as any).id);
  }

  @UseGuards(RolesGuard)
  @Roles('SystemAdmin')
  @Patch('providers/:id/deactivate')
  deactivateSmsProvider(@Param('id') id: string, @Req() req: Request) {
    return this.notificationsService.deactivateSmsProvider(id, (req.user as any).id);
  }

  @UseGuards(RolesGuard)
  @Roles('SystemAdmin')
  @Patch('providers/:id/default')
  setDefaultSmsProvider(@Param('id') id: string, @Req() req: Request) {
    return this.notificationsService.setDefaultSmsProvider(id, (req.user as any).id);
  }

  @UseGuards(RolesGuard)
  @Roles('SystemAdmin')
  @Post('providers/:id/test')
  testProvider(@Param('id') id: string, @Body() body: any, @Req() req: Request) {
    return this.notificationsService.testProvider(id, body.recipient, (req.user as any).id);
  }
}
