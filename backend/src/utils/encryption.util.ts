import * as crypto from 'crypto';

export class EncryptionUtil {
  private static getAlgorithm() {
    return 'aes-256-gcm';
  }

  private static getKey(isMfa: boolean = false): Buffer {
    const key = isMfa ? (process.env.MFA_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY) : process.env.ENCRYPTION_KEY;
    if (!key || key.length !== 32) {
      throw new Error(isMfa ? 'MFA_ENCRYPTION_KEY is missing or invalid.' : 'ENCRYPTION_KEY is missing or invalid.');
    }
    return Buffer.from(key, 'utf-8');
  }

  static encrypt(text: string, isMfa: boolean = false): string {
    if (!text) return text;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.getAlgorithm(), this.getKey(isMfa), iv) as crypto.CipherGCM;
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  static decrypt(encryptedData: string, isMfa: boolean = false): string {
    if (!encryptedData || !encryptedData.includes(':')) return encryptedData;
    
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted format.');
    }
    
    const [ivHex, authTagHex, encryptedText] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(this.getAlgorithm(), this.getKey(isMfa), iv) as crypto.DecipherGCM;
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
