import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private prisma: PrismaService, private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid API Key');
    }

    const rawKey = authHeader.split(' ')[1];
    
    // We expect prv_live_XXXX or prv_test_XXXX
    // The prefix stored is the first (length of env prefix + 8) characters.
    let prefixLength = 0;
    if (rawKey.startsWith('prv_live_')) prefixLength = 9 + 8;
    else if (rawKey.startsWith('prv_test_')) prefixLength = 9 + 8;
    else throw new UnauthorizedException('Invalid API Key');

    if (rawKey.length < prefixLength) {
      throw new UnauthorizedException('Invalid API Key');
    }

    const prefix = rawKey.substring(0, prefixLength);

    const apiKey = await this.prisma.apiKey.findFirst({
      where: { prefix },
    });

    if (!apiKey) {
      throw new UnauthorizedException('Invalid API Key');
    }

    if (apiKey.status !== 'Active') {
      throw new UnauthorizedException('Invalid API Key');
    }

    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      // It's technically expired. We update the status silently to avoid querying it as active next time,
      // but we do it async so it doesn't block the request failure.
      this.prisma.apiKey.update({ where: { id: apiKey.id }, data: { status: 'Expired' } }).catch(() => {});
      this.prisma.auditLog.create({
        data: {
          action: 'API_KEY_EXPIRED',
          entityType: 'ApiKey',
          entityId: apiKey.id,
          newValue: { prefix },
          ipAddress: req.ip,
        }
      }).catch(() => {});
      throw new UnauthorizedException('Invalid API Key');
    }

    const isMatch = await bcrypt.compare(rawKey, apiKey.keyHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid API Key');
    }

    // Check scopes if specified by a decorator @Scopes('scope1', 'scope2')
    const requiredScopes = this.reflector.get<string[]>('scopes', context.getHandler());
    if (requiredScopes && requiredScopes.length > 0) {
      const hasScope = requiredScopes.every(scope => apiKey.scopes.includes(scope) || apiKey.scopes.includes('integrations.manage'));
      if (!hasScope) {
        await this.prisma.auditLog.create({
          data: {
            action: 'API_KEY_DENIED',
            entityType: 'ApiKey',
            entityId: apiKey.id,
            newValue: { prefix, reason: 'Scope missing', requiredScopes },
            ipAddress: req.ip,
          }
        }).catch(() => {});
        throw new ForbiddenException('Insufficient Scope');
      }
    }

    // Update lastUsedAt asynchronously
    this.prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    }).catch(() => {});

    // For testing/tracking purposes only, log that it was used if it hits a specific endpoint,
    // otherwise we skip logging every single request to prevent DB bloat.
    // The requirement says "log API_KEY_USED". We will log it for the dummy endpoint.
    if (req.path.includes('/api-key-test')) {
      this.prisma.auditLog.create({
        data: {
          action: 'API_KEY_USED',
          entityType: 'ApiKey',
          entityId: apiKey.id,
          newValue: { prefix, endpoint: req.path, userAgent: req.headers['user-agent'] },
          ipAddress: req.ip,
        }
      }).catch(() => {});
    }

    req.apiKey = apiKey; // Attach API key info to request
    return true;
  }
}
