import { Injectable, Logger } from '@nestjs/common';
import { SmsProviderInterface } from './sms-provider.interface';
import axios from 'axios';

@Injectable()
export class KavenegarProvider implements SmsProviderInterface {
  private readonly logger = new Logger(KavenegarProvider.name);
  
  constructor(private readonly config?: { apiKey?: string; senderNumber?: string; baseUrl?: string }) {}

  private get apiKey() { return this.config?.apiKey || process.env.SMS_API_KEY || 'dummy_api_key'; }
  private get sender() { return this.config?.senderNumber || process.env.SMS_SENDER_NUMBER || '10008663'; }

  async send(recipient: string, message: string): Promise<string> {
    this.logger.debug(`Sending SMS via Kavenegar to ${recipient}`);
    try {
      // Dummy check for test environments
      if (this.apiKey === 'dummy_api_key') {
        this.logger.log(`[MOCK KAVENEGAR] Sent SMS to ${recipient}: ${message}`);
        return `mock-kavenegar-${Date.now()}`;
      }

      const res = await axios.post(`https://api.kavenegar.com/v1/${this.apiKey}/sms/send.json`, null, {
        params: {
          receptor: recipient,
          sender: this.sender,
          message: message
        }
      });
      return res.data?.entries?.[0]?.messageid?.toString() || `kvg-${Date.now()}`;
    } catch (error: any) {
      this.logger.error(`Kavenegar send failed: ${error.message}`);
      throw new Error(`Kavenegar send failed: ${error.message}`);
    }
  }

  async sendBulk(recipients: string[], message: string): Promise<string[]> {
    this.logger.debug(`Sending Bulk SMS via Kavenegar to ${recipients.length} recipients`);
    try {
      if (this.apiKey === 'dummy_api_key') {
        return recipients.map((r, i) => `mock-kavenegar-bulk-${Date.now()}-${i}`);
      }

      const res = await axios.post(`https://api.kavenegar.com/v1/${this.apiKey}/sms/send.json`, null, {
        params: {
          receptor: recipients.join(','),
          sender: this.sender,
          message: message
        }
      });
      return res.data?.entries?.map((e: any) => e.messageid?.toString()) || [];
    } catch (error: any) {
      throw new Error(`Kavenegar sendBulk failed: ${error.message}`);
    }
  }

  async checkStatus(providerMessageId: string): Promise<'Delivered' | 'Failed' | 'Queued'> {
    try {
      if (providerMessageId.startsWith('mock-')) return 'Delivered';

      const res = await axios.post(`https://api.kavenegar.com/v1/${this.apiKey}/sms/status.json`, null, {
        params: { messageid: providerMessageId }
      });
      const status = res.data?.entries?.[0]?.status;
      
      if (status === 10) return 'Delivered';
      if (status === 11 || status === 14) return 'Failed';
      return 'Queued'; // statuses 1, 2, 4, 5 etc
    } catch (error) {
      return 'Failed';
    }
  }
}
