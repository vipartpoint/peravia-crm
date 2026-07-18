import { Controller, Get, Delete, Param, UseGuards, Req } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  getAllSessions(@Req() req: Request) {
    const user = req.user as any;
    const isAdmin = ['SystemAdmin', 'CEO'].includes(user.role.name);
    return this.sessionsService.getActiveSessions(isAdmin ? undefined : user.id);
  }

  @Get('dashboard')
  getDashboard() {
    return this.sessionsService.getSecurityDashboard();
  }

  @Delete(':id/revoke')
  revokeSession(@Param('id') id: string, @Req() req: Request) {
    return this.sessionsService.revokeSession(id, req.user);
  }

  @Delete('user/:userId/revoke-all')
  revokeAll(@Param('userId') userId: string, @Req() req: Request) {
    return this.sessionsService.revokeAllUserSessions(userId, req.user);
  }
}
