import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';
async function run() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findFirst({ include: { role: true } });
  const token = jwt.sign(
    { sub: user!.id, username: user!.username, role: user!.role.name, jti: 'test-jti-curl' },
    'super-secret-jwt-key-replace-in-production',
    { expiresIn: '1h' }
  );
  await prisma.activeSession.create({
    data: { jti: 'test-jti-curl', userId: user!.id, isValid: true, lastActivity: new Date() }
  });

  const api = axios.create({ baseURL: 'http://localhost:3000/api/v1', headers: { Cookie: `access_token=${token}` } });
  try {
    const res = await api.get('/catalogs/lost-reasons');
    console.log(res.status);
  } catch (e: any) {
    console.log(e.response?.status, e.response?.data);
  }
  
  await prisma.activeSession.delete({ where: { jti: 'test-jti-curl' } });
  await prisma.$disconnect();
}
run();
