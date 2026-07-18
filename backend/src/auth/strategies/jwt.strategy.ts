import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService, private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: any) => {
          return request?.cookies?.access_token || null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super-secret-jwt-key-replace-in-production',
    });
  }

  async validate(payload: any) {
    if (payload.jti) {
      const session = await this.prisma.activeSession.findUnique({ where: { jti: payload.jti } });
      if (!session || !session.isValid) {
        throw new UnauthorizedException('Session is invalid or revoked');
      }
      // Update lastActivity
      await this.prisma.activeSession.update({
        where: { jti: payload.jti },
        data: { lastActivity: new Date() }
      });
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User account is inactive or deleted');
    }
    return { 
      id: payload.sub, 
      username: payload.username, 
      role: { name: payload.role },
      jti: payload.jti
    };
  }
}
