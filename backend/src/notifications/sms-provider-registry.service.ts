import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SmsProviderInterface } from './providers/sms-provider.interface';
import { EncryptionUtil } from '../utils/encryption.util';

import { KavenegarProvider } from './providers/kavenegar.provider';
import { IPPanelProvider } from './providers/ippanel.provider';
import { CustomHttpProvider } from './providers/custom-http.provider';
import { MockSmsProvider } from './providers/mock.provider';

@Injectable()
export class SmsProviderRegistryService {
  private readonly logger = new Logger(SmsProviderRegistryService.name);

  constructor(private prisma: PrismaService) {}

  async getActiveProvider(): Promise<SmsProviderInterface> {
    try {
      // 1. Check DB for active default provider
      const config = await this.prisma.smsProviderConfig.findFirst({
        where: { isDefault: true, status: 'Active' }
      });

      if (config) {
        this.logger.debug(`Loaded default SMS provider from DB: ${config.name} (${config.providerType})`);
        
        // Decrypt credentials
        const apiKey = config.encryptedApiKey ? EncryptionUtil.decrypt(config.encryptedApiKey) : undefined;
        const username = config.encryptedUsername ? EncryptionUtil.decrypt(config.encryptedUsername) : undefined;
        const password = config.encryptedPassword ? EncryptionUtil.decrypt(config.encryptedPassword) : undefined;
        const customHeaders = config.customHeadersEncrypted ? EncryptionUtil.decrypt(config.customHeadersEncrypted) : undefined;

        const providerConfig = {
          apiKey,
          username,
          password,
          customHeaders,
          senderNumber: config.senderNumber || undefined,
          baseUrl: config.baseUrl || undefined,
          customPayloadTemplate: config.customPayloadTemplate || undefined
        };

        switch (config.providerType) {
          case 'KAVENEGAR':
            return new KavenegarProvider(providerConfig);
          case 'IPPANEL':
            return new IPPanelProvider(providerConfig);
          case 'CUSTOM_HTTP':
            return new CustomHttpProvider(providerConfig);
          default:
            this.logger.warn(`Provider type ${config.providerType} from DB is not fully supported yet. Falling back.`);
            break;
        }
      }
    } catch (err: any) {
      this.logger.error(`Error loading provider from DB: ${err.message}. Falling back to ENV.`);
    }

    // 2. Fallback to ENV
    const envProvider = process.env.SMS_PROVIDER || 'mock';
    this.logger.debug(`Falling back to ENV provider: ${envProvider}`);
    switch (envProvider.toLowerCase()) {
      case 'kavenegar':
        return new KavenegarProvider();
      case 'ippanel':
        return new IPPanelProvider();
      case 'custom':
        return new CustomHttpProvider();
      case 'mock':
      default:
        return new MockSmsProvider();
    }
  }

  // Helper method to get a specific provider by ID (used for "Test SMS" functionality)
  async getProviderById(id: string): Promise<SmsProviderInterface | null> {
    const config = await this.prisma.smsProviderConfig.findUnique({ where: { id } });
    if (!config) return null;

    const apiKey = config.encryptedApiKey ? EncryptionUtil.decrypt(config.encryptedApiKey) : undefined;
    const username = config.encryptedUsername ? EncryptionUtil.decrypt(config.encryptedUsername) : undefined;
    const password = config.encryptedPassword ? EncryptionUtil.decrypt(config.encryptedPassword) : undefined;
    const customHeaders = config.customHeadersEncrypted ? EncryptionUtil.decrypt(config.customHeadersEncrypted) : undefined;

    const providerConfig = {
      apiKey,
      username,
      password,
      customHeaders,
      senderNumber: config.senderNumber || undefined,
      baseUrl: config.baseUrl || undefined,
      customPayloadTemplate: config.customPayloadTemplate || undefined
    };

    switch (config.providerType) {
      case 'KAVENEGAR':
        return new KavenegarProvider(providerConfig);
      case 'IPPANEL':
        return new IPPanelProvider(providerConfig);
      case 'CUSTOM_HTTP':
        return new CustomHttpProvider(providerConfig);
      default:
        return new MockSmsProvider();
    }
  }
}
