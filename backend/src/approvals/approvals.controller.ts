import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Post()
  create(@Body() data: any, @Req() req: Request) {
    return this.approvalsService.createWorkflowRequest({
      ...data,
      requestType: data.requestType || 'General',
      requiredLevels: data.requiredLevels || 1,
      requiredRoles: data.requiredRoles || ['SystemAdmin']
    }, req.user);
  }

  @Get('my-requests')
  getMyRequests(@Req() req: Request) {
    return this.approvalsService.getMyRequests((req.user as any).id);
  }

  @Get('pending')
  getPending(@Req() req: Request) {
    return this.approvalsService.getPendingApprovals(req.user);
  }

  @Post(':id/process')
  process(
    @Param('id') id: string,
    @Body('action') action: 'Approved' | 'Rejected',
    @Body('comments') comments: string,
    @Req() req: Request
  ) {
    return this.approvalsService.processApproval(id, action, comments, req.user);
  }
}
