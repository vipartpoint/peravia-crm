import { Controller, Get, Post, Body, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { AiAssistantService } from './ai-assistant.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai-assistant')
export class AiAssistantController {
  constructor(private readonly aiService: AiAssistantService) {}

  private checkAccess(req: any) {
    const role = req.user.role.name;
    if (role !== 'CEO' && role !== 'SalesManager') {
      throw new ForbiddenException('Only CEO and SalesManager can access AI Assistant');
    }
  }

  @Get('sessions')
  getSessions(@Req() req: Request) {
    this.checkAccess(req);
    return this.aiService.getSessions((req.user as any).id);
  }

  @Get('sessions/:id/messages')
  getMessages(@Param('id') id: string, @Req() req: Request) {
    this.checkAccess(req);
    return this.aiService.getMessages(id, (req.user as any).id);
  }

  @Post('query')
  processQuery(@Body('query') query: string, @Body('sessionId') sessionId: string, @Req() req: Request) {
    this.checkAccess(req);
    return this.aiService.processQuery((req.user as any).id, query, sessionId, req.ip);
  }
}
