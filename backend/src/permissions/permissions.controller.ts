import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  getAll() {
    return this.permissionsService.getAllPermissions();
  }

  @Get('role/:id')
  getRolePermissions(@Param('id') id: string) {
    return this.permissionsService.getRolePermissions(id);
  }

  @Post('role/:id')
  updateRolePermissions(@Param('id') id: string, @Body('permissionIds') permissionIds: string[], @Req() req: Request) {
    return this.permissionsService.updateRolePermissions(id, permissionIds, req.user);
  }

  @Get('user/:id')
  getUserPermissions(@Param('id') id: string) {
    return this.permissionsService.getUserPermissions(id);
  }

  @Post('user/:id')
  updateUserPermissions(@Param('id') id: string, @Body('overrides') overrides: any[], @Req() req: Request) {
    return this.permissionsService.updateUserPermissions(id, overrides, req.user);
  }
}
