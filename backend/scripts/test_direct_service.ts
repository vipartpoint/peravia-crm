import { PrismaClient } from '@prisma/client';
import { LostReasonAdapter } from '../src/catalogs/adapters/lost-reason.adapter';

async function run() {
  const prisma = new PrismaClient();
  const adapter = new LostReasonAdapter();
  
  try {
    const res = await adapter.findAll(prisma as any, { page: 1, pageSize: 20 });
    console.log("Success! Total:", res.pagination.total);
  } catch (e) {
    console.error("Adapter Error:", e);
  }
  await prisma.$disconnect();
}
run();
