import { CanActivate, ExecutionContext, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { LicenseService } from '../license.service';

@Injectable()
export class LicenseGuard implements CanActivate {
  constructor(private licenseService: LicenseService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    // Always allow the license status and health endpoints so admin can check what's wrong
    if (request.url.includes('/api/v1/system/license-status') || request.url.includes('/api/v1/health')) {
      return true;
    }

    const status = this.licenseService.getStatus();
    if (!status.valid) {
      throw new HttpException({
        statusCode: 402,
        error: 'Payment Required',
        message: 'Invalid or expired commercial license: ' + status.error,
      }, 402);
    }

    return true;
  }
}
