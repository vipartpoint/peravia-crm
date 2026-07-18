import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';

async function run() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findFirst({ include: { role: true } });
  if (!user) throw new Error('No user in db');

  console.log(`Using user: ${user.username} with role ${user.role.name}`);

  const token = jwt.sign(
    { sub: user.id, username: user.username, role: user.role.name, jti: 'test-jti' },
    'super-secret-jwt-key-replace-in-production',
    { expiresIn: '1h' }
  );

  await prisma.activeSession.create({
    data: {
      jti: 'test-jti',
      userId: user.id,
      isValid: true,
      lastActivity: new Date()
    }
  });

  const api = axios.create({
    baseURL: 'http://localhost:3002/api/v1',
    headers: { Cookie: `access_token=${token}` }
  });

  const endpoints = [
    '/catalogs/lost-reasons',
    '/catalogs/reopen-reasons',
    '/catalogs/competitors',
    '/catalogs/invalid-type'
  ];

  for (const ep of endpoints) {
    try {
      console.log(`\n--- GET ${ep} ---`);
      const res = await api.get(ep);
      console.log(`Status: ${res.status}`);
      console.log(JSON.stringify(res.data, null, 2));
    } catch (e: any) {
      console.log(`Status: ${e.response?.status}`);
      console.log(JSON.stringify(e.response?.data, null, 2));
    }
  }

  await prisma.activeSession.delete({ where: { jti: 'test-jti' } });
  await prisma.$disconnect();
}
run();
