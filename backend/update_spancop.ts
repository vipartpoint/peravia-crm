import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const newStages = [
    { order: 1, name: 'Suspect (S)' },
    { order: 2, name: 'Prospect (P)' },
    { order: 3, name: 'Approach (A)' },
    { order: 4, name: 'Negotiation (N)' },
    { order: 5, name: 'Close (C)' },
    { order: 6, name: 'Order (O)' },
    { order: 7, name: 'Payment (P)' },
    { order: 8, name: 'Lost' }
  ];

  for (const s of newStages) {
    // try to find by order first
    const existing = await prisma.salesFunnelStage.findFirst({
      where: { order: s.order }
    });

    if (existing) {
      await prisma.salesFunnelStage.update({
        where: { id: existing.id },
        data: { name: s.name }
      });
    } else {
      await prisma.salesFunnelStage.create({
        data: { name: s.name, order: s.order }
      });
    }
  }

  console.log('Stages updated to SPANCOP successfully.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
