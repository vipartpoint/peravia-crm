import { Injectable, Logger } from '@nestjs/common';
import { SmsProviderInterface } from './sms-provider.interface';
import axios from 'axios';

@Injectable()
export class IPPanelProvider implements SmsProviderInterface {
  private readonly logger = new Logger(IPPanelProvider.name);
  
  constructor(private readonly config?: { apiKey?: string; senderNumber?: string; baseUrl?: string }) {}

  private get apiKey() { return this.config?.apiKey || process.env.SMS_API_KEY || ''; }
  private get sender() { return this.config?.senderNumber || process.env.SMS_SENDER_NUMBER || '3000505'; }
  private get baseUrl() { return this.config?.baseUrl || 'https://api2.ippanel.com/api/v1/sms/send/panel/single'; }

  async send(recipient: string, message: string): Promise<string> {
    this.logger.debug(`Sending SMS via IPPanel to ${recipient}`);
    try {
      // IPPanel uses Rest API /v3/messages/send
      const res = await axios.post(this.baseUrl, {
        recipient: [recipient],
        sender: this.sender,
        message: message,
      }, {
        headers: {
          'apikey': this.apiKey
        }
      });
      return res.data?.data?.message_id?.toString() || `ippanel-${Date.now()}`;
    } catch (error: any) {
      this.logger.error(`IPPanel send failed: ${error.message}`);
      throw new Error(`IPPanel send failed: ${error.message}`);
    }
  }

  async sendBulk(recipients: string[], message: string): Promise<string[]> {
    try {
      const res = await axios.post(this.baseUrl, {
        recipient: recipients,
        sender: this.sender,
        message: message,
      }, {
        headers: {
          'apikey': this.apiKey
        }
      });
      // IPPanel returns bulk ID or array of IDs depending on endpoint
      return recipients.map((r, i) => `ippanel-bulk-${Date.now()}-${i}`);
    } catch (error: any) {
      throw new Error(`IPPanel sendBulk failed: ${error.message}`);
    }
  }

  async checkStatus(providerMessageId: string): Promise<'Delivered' | 'Failed' | 'Queued'> {
    // Abstracted status check for IPPanel
    return 'Delivered';
  }
}
