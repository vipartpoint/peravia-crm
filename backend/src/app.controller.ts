import { Controller, Get, Post, Body, Logger, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiKeyGuard } from './auth/guards/api-key.guard';
import { Scopes } from './auth/decorators/scopes.decorator';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('trigger-error')
  triggerError() {
    this.logger.log('Artificial error triggered');
    throw new Error('This is an artificial error for Sentry testing');
  }

  @Post('test-redaction')
  testRedaction(@Body() body: any) {
    this.logger.log({ msg: 'Testing Pino Redaction', ...body });
    return { success: true };
  }

  @UseGuards(ApiKeyGuard)
  @Scopes('portal.read')
  @Get('api-key-test')
  testApiKey() {
    return { success: true, message: 'API Key is valid and has required scopes' };
  }
}

