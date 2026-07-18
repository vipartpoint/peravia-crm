import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class PortalAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException('Token not found');
    }
    
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.CUSTOMER_PORTAL_JWT_SECRET || 'fallback_portal_secret',
      });
      
      if (payload.purpose !== 'customer_portal_tracking') {
        throw new UnauthorizedException('Invalid token purpose');
      }

      if (!payload.orderId || !payload.customerId) {
        throw new UnauthorizedException('Invalid token payload');
      }
      
      (request as any)['portalUser'] = payload;
    } catch {
      throw new UnauthorizedException('اطلاعات واردشده معتبر نیست.');
    }
    
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
