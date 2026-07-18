export interface SmsProviderInterface {
  send(recipient: string, message: string): Promise<string>; // Returns providerMessageId
  sendBulk(recipients: string[], message: string): Promise<string[]>; // Returns providerMessageIds
  checkStatus(providerMessageId: string): Promise<'Delivered' | 'Failed' | 'Queued'>;
}
