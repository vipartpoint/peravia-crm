import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class LicenseService implements OnModuleInit {
  private readonly logger = new Logger(LicenseService.name);
  private licenseStatus: any = { valid: false, error: 'Not initialized' };

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  onModuleInit() {
    this.validateLicense();
  }

  public validateLicense(): boolean {
    const licenseKey = this.configService.get<string>('LICENSE_KEY');
    const clientId = this.configService.get<string>('LICENSE_CLIENT_ID');
    const domain = this.configService.get<string>('LICENSE_DOMAIN');

    if (!licenseKey || !clientId || !domain) {
      this.logger.error('Missing license configuration (LICENSE_KEY, LICENSE_CLIENT_ID, LICENSE_DOMAIN)');
      this.licenseStatus = { valid: false, error: 'Missing configuration' };
      return false;
    }

    try {
      // In a real-world scenario, you would verify the JWT signature using a public key 
      // owned by your company. For this implementation, we decode to check the payload.
      const decoded: any = this.jwtService.decode(licenseKey);

      if (!decoded) {
        throw new Error('Invalid license format');
      }

      if (decoded.clientId !== clientId) {
        throw new Error('Client ID mismatch in license');
      }

      // Domain check (can allow wildcard for dev)
      if (decoded.domain !== domain && decoded.domain !== '*') {
        throw new Error('Domain mismatch in license');
      }

      // Expiration check
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < now) {
        throw new Error('License expired');
      }

      this.licenseStatus = {
        valid: true,
        client: clientId,
        domain: domain,
        expiresAt: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : null,
      };

      this.logger.log(`License validated successfully for client: ${clientId}`);
      return true;
    } catch (error) {
      this.logger.error(`License validation failed: ${error.message}`);
      this.licenseStatus = { valid: false, error: error.message };
      return false;
    }
  }

  public getStatus() {
    return this.licenseStatus;
  }
}
