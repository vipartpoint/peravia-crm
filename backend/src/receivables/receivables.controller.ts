import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { ReceivablesService } from './receivables.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('receivables')
export class ReceivablesController {
  constructor(private readonly receivablesService: ReceivablesService) {}

  @Get('summary')
  getSummary(@Req() req: Request) {
    return this.receivablesService.getSummary(req.user);
  }

  @Get('customers')
  getAll(@Req() req: Request) {
    return this.receivablesService.getCustomerReceivables(undefined, req.user);
  }

  @Get('customers/:id')
  getOne(@Param('id') id: string, @Req() req: Request) {
    return this.receivablesService.getOne(id, req.user);
  }
}
