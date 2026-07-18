import { Injectable, Logger } from '@nestjs/common';
import { SmsProviderInterface } from './sms-provider.interface';
import axios from 'axios';

@Injectable()
export class CustomHttpProvider implements SmsProviderInterface {
  private readonly logger = new Logger(CustomHttpProvider.name);
  
  constructor(private readonly config?: { 
    apiKey?: string; 
    senderNumber?: string; 
    baseUrl?: string;
    customHeaders?: string;
    customPayloadTemplate?: string;
  }) {}

  private get apiKey() { return this.config?.apiKey || process.env.SMS_API_KEY || ''; }
  private get sender() { return this.config?.senderNumber || process.env.SMS_SENDER_NUMBER || ''; }
  private get baseUrl() { return this.config?.baseUrl || process.env.SMS_BASE_URL || ''; }
  
  async send(recipient: string, message: string): Promise<string> {
    this.logger.debug(`Sending SMS via Custom HTTP Provider to ${recipient}`);
    try {
      if (!this.baseUrl) throw new Error('SMS_BASE_URL is not defined for CustomHttpProvider');
      
      let headers: any = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      };

      if (this.config?.customHeaders) {
        try {
          const parsedHeaders = JSON.parse(this.config.customHeaders);
          headers = { ...headers, ...parsedHeaders };
        } catch (e) {
          this.logger.warn('Failed to parse customHeaders JSON. Using defaults.');
        }
      }

      let payload: any = {
        to: recipient,
        from: this.sender,
        text: message,
      };

      if (this.config?.customPayloadTemplate) {
        try {
          // Payload template is expected to be a string like: '{"recipient": "{to}", "body": "{message}"}'
          const replaced = this.config.customPayloadTemplate
            .replace(/{to}/g, recipient)
            .replace(/{message}/g, message)
            .replace(/{from}/g, this.sender);
          payload = JSON.parse(replaced);
        } catch (e) {
          this.logger.warn('Failed to parse customPayloadTemplate JSON. Using defaults.');
        }
      }
      
      const res = await axios.post(this.baseUrl, payload, { headers });
      return res.data?.messageId || `custom-${Date.now()}`;
    } catch (error: any) {
      this.logger.error(`Custom HTTP send failed: ${error.message}`);
      throw new Error(`Custom HTTP send failed: ${error.message}`);
    }
  }

  async sendBulk(recipients: string[], message: string): Promise<string[]> {
    throw new Error('Bulk sending not implemented for CustomHttpProvider');
  }

  async checkStatus(providerMessageId: string): Promise<'Delivered' | 'Failed' | 'Queued'> {
    return 'Delivered';
  }
}
