import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ApiKeysService {
  constructor(private prisma: PrismaService) {}

  async createKey(data: { name: string; scopes: string[]; expiresAt?: string; createdBy: string }, ipAddress?: string) {
    const existing = await this.prisma.apiKey.findUnique({ where: { name: data.name } });
    if (existing) {
      throw new ConflictException('API key with this name already exists.');
    }

    const envPrefix = process.env.NODE_ENV === 'production' ? 'prv_live_' : 'prv_test_';
    const rawSecret = crypto.randomBytes(32).toString('hex');
    const rawKey = `${envPrefix}${rawSecret}`;
    
    const storedPrefix = rawKey.substring(0, envPrefix.length + 8);
    
    const saltRounds = 10;
    const keyHash = await bcrypt.hash(rawKey, saltRounds);

    const expiresAt = data.expiresAt ? new Date(data.expiresAt) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const apiKey = await this.prisma.apiKey.create({
      data: {
        name: data.name,
        prefix: storedPrefix,
        keyHash,
        scopes: data.scopes,
        expiresAt,
        createdBy: data.createdBy,
        status: 'Active',
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: data.createdBy,
        action: 'API_KEY_CREATED',
        entityType: 'ApiKey',
        entityId: apiKey.id,
        newValue: { prefix: storedPrefix, scopes: data.scopes },
        ipAddress,
      },
    });

    return {
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        prefix: apiKey.prefix,
        status: apiKey.status,
        scopes: apiKey.scopes,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
      },
      rawKey,
    };
  }

  async revokeKey(id: string, userId: string, ipAddress?: string) {
    const apiKey = await this.prisma.apiKey.findUnique({ where: { id } });
    if (!apiKey) throw new NotFoundException('API Key not found');
    if (apiKey.status === 'Revoked') throw new BadRequestException('API Key is already revoked');

    const updated = await this.prisma.apiKey.update({
      where: { id },
      data: { status: 'Revoked', revokedAt: new Date() },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'API_KEY_REVOKED',
        entityType: 'ApiKey',
        entityId: updated.id,
        newValue: { prefix: updated.prefix },
        ipAddress,
      },
    });

    return { success: true };
  }

  async getKeys() {
    return this.prisma.apiKey.findMany({
      select: {
        id: true,
        name: true,
        prefix: true,
        status: true,
        scopes: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true,
        revokedAt: true,
        createdBy: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
