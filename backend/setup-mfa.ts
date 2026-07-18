import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { EncryptionUtil } from './src/utils/encryption.util';
import * as speakeasy from 'speakeasy';

const prisma = new PrismaClient();

async function run() {
  try {
    const secret = 'JBSWY3DPEHPK3PXP';
    const encrypted = EncryptionUtil.encrypt(secret, true);
    
    await prisma.user.update({
      where: { username: 'admin' },
      data: {
        mfaEnabled: true,
        mfaSecretEncrypted: encrypted,
        mfaEnabledAt: new Date()
      }
    });

    const token = speakeasy.totp({
      secret: secret,
      encoding: 'base32'
    });

    console.log('SECRET=' + secret);
    console.log('TOKEN=' + token);
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
