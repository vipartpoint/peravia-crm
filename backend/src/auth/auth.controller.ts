import { Controller, Get, Post, Body, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: any, @Req() req: any, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.validateUser(body.username, body.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials or account inactive');
    }
    
    const tokens = await this.authService.login(user, req);

    if ((tokens as any).message === 'PASSWORD_CHANGE_REQUIRED') {
      return tokens;
    }
    
    if (tokens.mfaRequired) {
      return {
        message: 'MFA_REQUIRED',
        mfaToken: (tokens as any).mfaToken,
      };
    }

    // Set HttpOnly cookie for Access Token
    res.cookie('access_token', (tokens as any).accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 mins
    });

    // Set HttpOnly cookie for Refresh Token
    res.cookie('refresh_token', (tokens as any).refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      message: 'Logged in successfully',
    };
  }

  @Post('mfa/verify-login')
  async verifyMfaLogin(@Body() body: any, @Req() req: any, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.verifyMfaLogin(body.mfaToken, body.code, body.rememberDevice, req);

    res.cookie('access_token', tokens.accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 15 * 60 * 1000 });
    res.cookie('refresh_token', tokens.refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });

    if (tokens.trustedDeviceToken) {
      res.cookie('trusted_device_token', tokens.trustedDeviceToken, {
        httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000
      });
    }

    return { message: 'Logged in successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/setup')
  async setupMfa(@Req() req: any) {
    return this.authService.setupMfa(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/enable')
  async enableMfa(@Req() req: any, @Body('code') code: string) {
    return this.authService.enableMfa(req.user.id, code);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/disable')
  async disableMfa(@Req() req: any, @Body() body: any) {
    return this.authService.disableMfa(req.user.id, body.password, body.code);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/reset')
  async resetMfa(@Req() req: any, @Body() body: any) {
    return this.authService.resetMfa(req.user.id, body.targetUserId, body.reason);
  }

  @Post('change-temporary-password')
  async changeTemporaryPassword(@Body() body: any) {
    return this.authService.changeTemporaryPassword(body.username, body.oldPassword, body.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    if (req.user) {
      await this.authService.logout(req);
    }
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return { message: 'Logged out successfully' };
  }


  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: any) {
    return this.authService.getMe(req.user.id);
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) throw new UnauthorizedException('No refresh token provided');
    
    // Validate refresh token and issue new access token
    return { message: 'Token refreshed (Implementation pending full JWT verify)' };
  }
}
