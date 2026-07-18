import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApprovalCenterService } from './approval-center.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('approvals')
export class ApprovalCenterController {
  constructor(private readonly service: ApprovalCenterService) {}

  @Get('dashboard')
  async getDashboardMetrics(@Request() req: any) {
    const roleName = req.user.role?.name || req.user.role;
    return this.service.getDashboardMetrics(req.user.id, roleName);
  }

  @Get('my-pending')
  async getMyPending(@Request() req: any) {
    return this.service.getMyPending(req.user.id);
  }

  @Get()
  async findAll(@Query() query: any, @Request() req: any) {
    const roleName = req.user.role?.name || req.user.role;
    return this.service.findAll(req.user.id, roleName, query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    const roleName = req.user.role?.name || req.user.role;
    return this.service.findOne(id, req.user.id, roleName);
  }

  @Patch(':id/approve')
  async approve(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    const roleName = req.user.role?.name || req.user.role;
    return this.service.processApproval(id, req.user.id, roleName, 'Approved', body.comments);
  }

  @Patch(':id/reject')
  async reject(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    const roleName = req.user.role?.name || req.user.role;
    return this.service.processApproval(id, req.user.id, roleName, 'Rejected', body.comments);
  }
}
