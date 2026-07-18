const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);
  const srRole = await prisma.role.findUnique({ where: { name: 'SalesRep' } });
  const finRole = await prisma.role.findUnique({ where: { name: 'Finance' } });

  await prisma.user.upsert({
    where: { username: 'rep1' },
    update: { passwordHash },
    create: { username: 'rep1', passwordHash, roleId: srRole.id, isActive: true },
  });

  await prisma.user.upsert({
    where: { username: 'rep2' },
    update: { passwordHash },
    create: { username: 'rep2', passwordHash, roleId: srRole.id, isActive: true },
  });

  await prisma.user.upsert({
    where: { username: 'finance1' },
    update: { passwordHash },
    create: { username: 'finance1', passwordHash, roleId: finRole.id, isActive: true },
  });

  console.log('Test users created.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
