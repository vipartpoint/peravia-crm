import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { CommissionsService } from './commissions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('commissions')
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  @Get()
  findAll(@Req() req: Request) {
    return this.commissionsService.findAll(req.user);
  }

  @Post('calculate')
  calculate(@Req() req: Request) {
    return this.commissionsService.calculateCommissions(req.user);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string, @Req() req: Request) {
    return this.commissionsService.updateStatus(id, status, req.user);
  }
}
