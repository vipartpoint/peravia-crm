import { PrismaClient } from '@prisma/client';

async function run() {
  const prisma = new PrismaClient();
  try {
    const data = await prisma.lostReason.findMany({
      include: { _count: { select: { opportunities: true } } }
    });
    console.log(data);
  } catch (e: any) {
    console.error("Prisma error:", e);
  }
  await prisma.$disconnect();
}
run();
