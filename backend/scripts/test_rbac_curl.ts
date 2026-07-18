import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

async function run() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findFirst({ 
    where: { role: { name: { not: 'ADMIN' } } },
    include: { role: true } 
  });
  
  const token = jwt.sign(
    { sub: user!.id, username: user!.username, role: user!.role.name, jti: 'test-jti-rbac-curl' },
    'super-secret-jwt-key-replace-in-production',
    { expiresIn: '1h' }
  );

  await prisma.activeSession.create({
    data: { jti: 'test-jti-rbac-curl', userId: user!.id, isValid: true, lastActivity: new Date() }
  });

  console.log(token);
  await prisma.$disconnect();
}
run();
