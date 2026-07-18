import { Controller, Get, Post, Body, Param, Req, UseGuards, Ip } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';

@Controller('api-keys')
@UseGuards(ThrottlerGuard, JwtAuthGuard, RolesGuard)
@Roles('SystemAdmin')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post()
  create(@Body() createApiKeyDto: CreateApiKeyDto, @Req() req: any, @Ip() ip: string) {
    return this.apiKeysService.createKey({
      ...createApiKeyDto,
      createdBy: req.user.userId,
    }, ip);
  }

  @Get()
  findAll() {
    return this.apiKeysService.getKeys();
  }

  @Post(':id/revoke')
  revoke(@Param('id') id: string, @Req() req: any, @Ip() ip: string) {
    return this.apiKeysService.revokeKey(id, req.user.userId, ip);
  }
}
