import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  try {
    const lastOpp = await prisma.opportunity.findFirst();
    if (!lastOpp) {
      console.log('No opp found');
      return;
    }
    
    // Simulate what the update does
    await prisma.auditLog.create({
      data: {
        userId: 'system-user',
        action: 'OPPORTUNITY_STAGE_CHANGED',
        entityType: 'Opportunity',
        entityId: lastOpp.id
      }
    });
    console.log('AuditLog created successfully');
  } catch (e: any) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
