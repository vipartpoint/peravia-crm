import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';

async function run() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findFirst();
  if (!user) throw new Error('No user in db');

  // Create JWT for ADMIN by hardcoding the role
  const token = jwt.sign(
    { sub: user.id, username: user.username, role: 'ADMIN', jti: 'test-jti-valid' },
    'super-secret-jwt-key-replace-in-production',
    { expiresIn: '1h' }
  );

  await prisma.activeSession.create({
    data: { jti: 'test-jti-valid', userId: user.id, isValid: true, lastActivity: new Date() }
  });

  const api = axios.create({
    baseURL: 'http://localhost:3002/api/v1',
    headers: { Cookie: `access_token=${token}` }
  });

  console.log(`\n--- POST /catalogs/lost-reasons (Unknown Field) ---`);
  try {
    const res = await api.post('/catalogs/lost-reasons', {
      code: "TEST_SECURITY",
      nameFa: "تست امنیت",
      nameEn: "Security Test",
      hackedField: "malicious_value"
    });
    console.log(`Status: ${res.status}`);
  } catch (e: any) {
    if (e.response) {
      console.log(`Status: ${e.response.status}`);
      console.log(JSON.stringify(e.response.data, null, 2));
    } else {
      console.error(e);
    }
  }

  await prisma.activeSession.delete({ where: { jti: 'test-jti-valid' } });
  await prisma.$disconnect();
}
run();
