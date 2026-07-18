import { Controller, Get, Patch, Delete, Param, Query, UseGuards, Request } from '@nestjs/common';
import { NotificationsCenterService } from './notifications-center.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsCenterController {
  constructor(private readonly service: NotificationsCenterService) {}

  @Get()
  async findAll(@Query() query: any, @Request() req: any) {
    const userId = req.user.id;
    const roleName = req.user.role?.name || req.user.role;
    return this.service.findAll(userId, roleName, query);
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    const count = await this.service.getUnreadCount(req.user.id);
    return { unreadCount: count };
  }

  @Patch('read-all')
  async markAllAsRead(@Request() req: any) {
    return this.service.markAllAsRead(req.user.id);
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    const roleName = req.user.role?.name || req.user.role;
    return this.service.markAsRead(id, req.user.id, roleName);
  }

  @Patch(':id/archive')
  async archive(@Param('id') id: string, @Request() req: any) {
    const roleName = req.user.role?.name || req.user.role;
    return this.service.archive(id, req.user.id, roleName);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    const roleName = req.user.role?.name || req.user.role;
    return this.service.delete(id, req.user.id, roleName);
  }
}
