import { Injectable, UnauthorizedException, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { EncryptionUtil } from '../utils/encryption.util';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ 
      where: { username },
      include: { role: true }
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isLocked) {
      throw new ForbiddenException('Account is locked due to too many failed attempts.');
    }

    const isPasswordValid = await bcrypt.compare(pass, user.passwordHash);

    if (!isPasswordValid) {
      const failedLogins = user.failedLogins + 1;
      if (failedLogins >= 5) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { failedLogins, isLocked: true }
        });
        await this.prisma.auditLog.create({
          data: { userId: user.id, action: 'USER_LOCKED', entityType: 'User', entityId: user.id }
        });
        await this.notifications.sendNotification({
          userId: user.id,
          title: 'هشدار امنیتی: مسدودی حساب',
          message: 'حساب شما به دلیل تلاش‌های ناموفق مکرر مسدود شد.',
          type: 'Security',
          priority: 'Critical',
          entityType: 'User',
          actionUrl: '/login',
          fingerprint: `locked-${user.id}-${Date.now()}`
        });
        const admins = await this.prisma.user.findMany({ where: { role: { name: 'SystemAdmin' } } });
        for (const admin of admins) {
          await this.notifications.sendNotification({
            userId: admin.id,
            title: 'هشدار امنیتی سیستم',
            message: `حساب کاربری ${user.username} مسدود شد.`,
            type: 'Security',
            priority: 'Critical',
            entityType: 'User',
            entityId: user.id,
            actionUrl: '/users',
            fingerprint: `admin-locked-${user.id}-${Date.now()}`
          });
        }
      } else {
        await this.prisma.user.update({ where: { id: user.id }, data: { failedLogins } });
      }
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed logins
    if (user.failedLogins > 0) {
      await this.prisma.user.update({ where: { id: user.id }, data: { failedLogins: 0 } });
    }

    const { passwordHash, mfaSecretEncrypted, mustChangePassword, ...result } = user as any;
    return { ...result, mustChangePassword };
  }

  async changeTemporaryPassword(username: string, oldPass: string, newPass: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    
    if (!user.mustChangePassword) throw new ForbiddenException('Password change not required');

    const isValid = await bcrypt.compare(oldPass, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    if (newPass.length < 8) {
      throw new ForbiddenException('Password must be at least 8 characters long');
    }

    const passwordHash = await bcrypt.hash(newPass, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, mustChangePassword: false }
    });

    return { message: 'Password changed successfully. Please login with your new password.' };
  }

  async login(user: any, req?: any) {
    // if (user.mustChangePassword) {
    //   return {
    //     message: 'PASSWORD_CHANGE_REQUIRED',
    //     userId: user.id,
    //   };
    // }

    // Check trusted device first if MFA is enabled
    let bypassMfa = true; // TODO: Revert this temporary MFA bypass before deploying to server!
    if (user.mfaEnabled && req && req.cookies['trusted_device_token']) {
      const deviceToken = req.cookies['trusted_device_token'];
      const deviceTokenHash = require('crypto').createHash('sha256').update(deviceToken).digest('hex');
      const trustedDevice = await this.prisma.trustedDevice.findFirst({
        where: {
          userId: user.id,
          deviceTokenHash,
          expiresAt: { gt: new Date() },
          revokedAt: null
        }
      });
      if (trustedDevice) {
        bypassMfa = true;
        await this.prisma.trustedDevice.update({
          where: { id: trustedDevice.id },
          data: { lastUsedAt: new Date() }
        });
      }
    }

    if (user.mfaEnabled && !bypassMfa) {
      const mfaTokenPayload = { sub: user.id, purpose: 'mfa_verification' };
      const mfaToken = this.jwtService.sign(mfaTokenPayload, { expiresIn: '5m' });
      return {
        mfaRequired: true,
        mfaToken,
      };
    }

    return this.issueFullTokens(user, req);
  }

  private async issueFullTokens(user: any, req?: any, deviceToken?: string) {
    const jti = require('crypto').randomUUID();
    
    if (req) {
      await this.prisma.activeSession.create({
        data: {
          jti,
          userId: user.id,
          ipAddress: req.ip || req.headers?.['x-forwarded-for'] || 'unknown',
          userAgent: req.headers?.['user-agent'] || 'unknown',
        }
      });
    }

    const payload = { username: user.username, sub: user.id, role: user.role?.name || user.role, jti };
    const accessToken = this.jwtService.sign(payload, { expiresIn: (process.env.JWT_EXPIRATION || '15m') as any });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    
    await this.logAuthEvent(user.id, 'LOGIN_SUCCESS', req?.ip);

    return {
      mfaRequired: false,
      accessToken,
      refreshToken,
      trustedDeviceToken: deviceToken
    };
  }

  async verifyMfaLogin(mfaToken: string, code: string, rememberDevice: boolean, req?: any) {
    try {
      const decoded = this.jwtService.verify(mfaToken);
      if (decoded.purpose !== 'mfa_verification') throw new UnauthorizedException('Invalid token purpose');
      
      const user = await this.prisma.user.findUnique({ where: { id: decoded.sub }, include: { role: true } });
      if (!user || !user.mfaEnabled || !user.mfaSecretEncrypted) {
        throw new UnauthorizedException('MFA not properly configured');
      }

      const secret = EncryptionUtil.decrypt(user.mfaSecretEncrypted, true);
      const isValidTotp = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: code,
        window: 1
      });

      let isValidCode = isValidTotp;

      if (!isValidCode) {
        // Check recovery codes
        const recoveryCodes = await this.prisma.mfaRecoveryCode.findMany({
          where: { userId: user.id, usedAt: null }
        });
        
        for (const rc of recoveryCodes) {
          const isMatch = await bcrypt.compare(code, rc.codeHash);
          if (isMatch) {
            isValidCode = true;
            await this.prisma.mfaRecoveryCode.update({
              where: { id: rc.id },
              data: { usedAt: new Date() }
            });
            await this.logAuthEvent(user.id, 'MFA_RECOVERY_CODE_USED', req?.ip);
            break;
          }
        }
      }

      if (!isValidCode) {
        await this.logAuthEvent(user.id, 'MFA_LOGIN_FAILED', req?.ip);
        throw new UnauthorizedException('Invalid MFA code');
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: { mfaLastUsedAt: new Date() }
      });

      let deviceToken = undefined;
      if (rememberDevice) {
        const rawToken = require('crypto').randomBytes(32).toString('hex');
        deviceToken = rawToken;
        const deviceTokenHash = require('crypto').createHash('sha256').update(rawToken).digest('hex');
        
        await this.prisma.trustedDevice.create({
          data: {
            userId: user.id,
            deviceTokenHash,
            deviceName: req?.headers?.['user-agent']?.substring(0, 200) || 'Unknown Browser',
            ipAddress: req?.ip || req?.headers?.['x-forwarded-for'] || 'unknown',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        });
        await this.logAuthEvent(user.id, 'MFA_TRUSTED_DEVICE_ADDED', req?.ip);
      }

      return this.issueFullTokens(user, req, deviceToken);

    } catch (e) {
      throw new UnauthorizedException('Invalid or expired MFA token');
    }
  }

  async setupMfa(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    
    await this.logAuthEvent(userId, 'MFA_SETUP_STARTED', 'System');

    const secretObj = speakeasy.generateSecret({ length: 20, name: 'Peravia CRM (' + user.username + ')' });
    const secret = secretObj.base32;
    const otpauthUrl = secretObj.otpauth_url || '';
    
    const encryptedSecret = EncryptionUtil.encrypt(secret, true);
    await this.usersService.updateMfaSecret(userId, encryptedSecret);
    
    const qrcode = require('qrcode');
    const qrDataUrl = await qrcode.toDataURL(otpauthUrl);

    return { secret, qrDataUrl };
  }

  async enableMfa(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.mfaSecretEncrypted) throw new UnauthorizedException('MFA not setup');
    
    const secret = EncryptionUtil.decrypt(user.mfaSecretEncrypted, true);
    const isValid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
      window: 1
    });

    if (!isValid) throw new UnauthorizedException('Invalid TOTP code');

    // Generate 10 recovery codes
    const rawCodes = [];
    for (let i = 0; i < 10; i++) {
      rawCodes.push(require('crypto').randomBytes(4).toString('hex').toUpperCase());
    }

    // Hash and store
    await this.prisma.mfaRecoveryCode.deleteMany({ where: { userId } });
    for (const rc of rawCodes) {
      const codeHash = await bcrypt.hash(rc, 10);
      await this.prisma.mfaRecoveryCode.create({
        data: { userId, codeHash }
      });
    }

    await this.usersService.enableMfa(userId);
    await this.logAuthEvent(userId, 'MFA_ENABLED', 'System');

    return { recoveryCodes: rawCodes };
  }

  async disableMfa(userId: string, password: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    if (!user.mfaEnabled) return { message: 'Already disabled' };

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid password');

    const secret = EncryptionUtil.decrypt(user.mfaSecretEncrypted || '', true);
    let isValidCode = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
      window: 1
    });

    if (!isValidCode) {
      const recoveryCodes = await this.prisma.mfaRecoveryCode.findMany({ where: { userId, usedAt: null } });
      for (const rc of recoveryCodes) {
        const isMatch = await bcrypt.compare(code, rc.codeHash);
        if (isMatch) {
          isValidCode = true;
          await this.prisma.mfaRecoveryCode.update({ where: { id: rc.id }, data: { usedAt: new Date() } });
          break;
        }
      }
    }

    if (!isValidCode) throw new UnauthorizedException('Invalid MFA or Recovery code');

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: false, mfaSecretEncrypted: null, mfaEnabledAt: null }
    });
    
    await this.prisma.mfaRecoveryCode.deleteMany({ where: { userId } });
    await this.prisma.trustedDevice.deleteMany({ where: { userId } });

    await this.logAuthEvent(userId, 'MFA_DISABLED', 'System');

    return { message: 'MFA disabled successfully' };
  }

  async resetMfa(adminId: string, targetUserId: string, reason: string) {
    const admin = await this.prisma.user.findUnique({ where: { id: adminId }, include: { role: true } });
    if (admin?.role.name !== 'SystemAdmin') throw new ForbiddenException('Only SystemAdmin can reset MFA');

    const targetUser = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) throw new NotFoundException('User not found');

    if (!reason || reason.trim().length < 5) {
      throw new BadRequestException('A valid reason is required for MFA reset');
    }

    await this.prisma.user.update({
      where: { id: targetUserId },
      data: { mfaEnabled: false, mfaSecretEncrypted: null, mfaEnabledAt: null }
    });
    await this.prisma.mfaRecoveryCode.deleteMany({ where: { userId: targetUserId } });
    await this.prisma.trustedDevice.deleteMany({ where: { userId: targetUserId } });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'MFA_RESET',
        entityType: 'User',
        entityId: targetUserId,
        newValue: { reason },
        ipAddress: 'System'
      }
    });

    return { message: 'MFA reset successfully for user' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        username: true,
        email: true,
        mfaEnabled: true,
        isActive: true,
        role: { select: { id: true, name: true } },
        territory: { select: { id: true, name: true } },
        mustChangePassword: true,
      }
    });
    if (!user || !user.isActive) throw new UnauthorizedException('User not found or inactive');
    return { user };
  }

  async logout(req: any) {
    const user = req.user;
    if (user && user.jti) {
      await this.prisma.activeSession.update({
        where: { jti: user.jti },
        data: { isValid: false, revokedAt: new Date() }
      });
    }
    return { message: 'Logged out successfully' };
  }

  private async logAuthEvent(userId: string, action: string, ipAddress: string = 'System') {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        ipAddress,
      }
    });
  }
}
