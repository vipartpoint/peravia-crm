import { PrismaClient } from '@prisma/client';

async function run() {
  const prisma = new PrismaClient();
  const customer = await prisma.customer.findFirst();
  const user = await prisma.user.findFirst();
  
  if (!customer || !user) throw new Error("Missing dependencies");

  const payload = {
    name: "Runtime Verification Test Opp 1",
    customerId: customer.id,
    ownerId: user.id,
    probability: 20
  };

  console.log("=== API REQUEST PAYLOAD ===");
  console.log(JSON.stringify(payload, null, 2));

  const response = await fetch('http://localhost:3002/api/v1/opportunities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
    body: JSON.stringify(payload)
  });

  const apiResponse = await response.json();
  console.log("\n=== API RESPONSE ===");
  console.log(JSON.stringify(apiResponse, null, 2));

  if (!apiResponse.id) {
    throw new Error("Failed to create opportunity");
  }

  const dbRecord = await prisma.opportunity.findUnique({
    where: { id: apiResponse.id },
    include: {
      stageHistory: true
    }
  });

  const activities = await prisma.activity.findMany({
    where: { entityId: apiResponse.id, entityType: 'Opportunity' }
  });

  console.log("\n=== DATABASE RECORD ===");
  console.log(JSON.stringify(dbRecord, null, 2));

  console.log("\n=== VALIDATION RESULTS ===");
  console.log("Default salesStage = Suspect:", dbRecord?.salesStage === 'Suspect' ? 'PASS' : 'FAIL');
  console.log("Default status = Open:", dbRecord?.status === 'Open' ? 'PASS' : 'FAIL');
  
  const hasStageHistory = dbRecord?.stageHistory.some((h: any) => h.stage === 'Suspect');
  console.log("Timeline entry generated:", hasStageHistory ? 'PASS' : 'FAIL');

  const hasActivity = activities.some((a: any) => a.activityType === 'Created');
  console.log("Activity created:", hasActivity ? 'PASS' : 'FAIL');

  await prisma.$disconnect();
}

run().catch(console.error);
