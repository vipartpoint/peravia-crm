import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { EncryptionUtil } from './src/utils/encryption.util';
import * as speakeasy from 'speakeasy';

const prisma = new PrismaClient();

async function test() {
  const user = await prisma.user.findUnique({ where: { username: 'admin' } });
  if (!user) return console.log('User not found');
  console.log('MFA Enabled:', user.mfaEnabled);
  
  try {
    const decryptedSecret = EncryptionUtil.decrypt(user.mfaSecretEncrypted!, true);
    console.log('Decrypted Secret:', decryptedSecret);
    console.log('Does it match JBSWY3DPEHPK3PXP?', decryptedSecret === 'JBSWY3DPEHPK3PXP');
    
    const code = speakeasy.totp({ secret: decryptedSecret, encoding: 'base32' });
    console.log('Current generated code:', code);
    
    const isValid = speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: 'base32',
      token: code,
      window: 1
    });
    console.log('Is the generated code valid using speakeasy.totp.verify?', isValid);
  } catch (err) {
    console.error('Error decrypting or verifying:', err);
  } finally {
    await prisma.$disconnect();
  }
}
test();
