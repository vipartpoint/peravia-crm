import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clear() {
  await prisma.approvalHistory.deleteMany();
  await prisma.approvalRequest.deleteMany();
  console.log('Cleared approvals table');
  await prisma.$disconnect();
}

clear();
