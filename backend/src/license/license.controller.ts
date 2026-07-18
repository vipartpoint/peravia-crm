import { Controller, Get, UseGuards } from '@nestjs/common';
import { LicenseService } from './license.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('system')
export class LicenseController {
  constructor(private readonly licenseService: LicenseService) {}

  @Get('license-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SystemAdmin')
  getLicenseStatus() {
    return this.licenseService.getStatus();
  }
}
