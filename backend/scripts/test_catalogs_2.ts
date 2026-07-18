import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';

async function run() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findFirst({ where: { role: { name: 'ADMIN' } } });
  if (!user) throw new Error('No admin user');

  const token = jwt.sign(
    { sub: user.id, username: user.username, role: 'ADMIN' },
    'super-secret-jwt-key-replace-in-production',
    { expiresIn: '1h' }
  );

  const api = axios.create({
    baseURL: 'http://localhost:3000/api/v1',
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

  await prisma.$disconnect();
}
run();
