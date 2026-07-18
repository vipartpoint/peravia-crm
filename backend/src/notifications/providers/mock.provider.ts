import { Injectable, Logger } from '@nestjs/common';
import { SmsProviderInterface } from './sms-provider.interface';

@Injectable()
export class MockSmsProvider implements SmsProviderInterface {
  private readonly logger = new Logger(MockSmsProvider.name);

  async send(recipient: string, message: string): Promise<string> {
    this.logger.log(`[MOCK] Sent SMS to ${recipient}: ${message}`);
    return `mock-sms-${Date.now()}`;
  }

  async sendBulk(recipients: string[], message: string): Promise<string[]> {
    this.logger.log(`[MOCK] Sent Bulk SMS to ${recipients.length} recipients`);
    return recipients.map((r, i) => `mock-sms-bulk-${Date.now()}-${i}`);
  }

  async checkStatus(providerMessageId: string): Promise<'Delivered' | 'Failed' | 'Queued'> {
    this.logger.debug(`[MOCK] Checking status for ${providerMessageId}`);
    return 'Delivered';
  }
}
