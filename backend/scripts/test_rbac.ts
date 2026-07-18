import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';

async function run() {
  const prisma = new PrismaClient();
  
  // Get a non-admin user
  const user = await prisma.user.findFirst({ 
    where: { role: { name: { not: 'ADMIN' } } },
    include: { role: true } 
  });
  if (!user) throw new Error('No non-admin user in db');

  console.log(`Using user: ${user.username} with role ${user.role.name}`);

  // Create JWT for non-admin
  const token = jwt.sign(
    { sub: user.id, username: user.username, role: user.role.name, jti: 'test-jti-rbac' },
    'super-secret-jwt-key-replace-in-production',
    { expiresIn: '1h' }
  );

  await prisma.activeSession.create({
    data: { jti: 'test-jti-rbac', userId: user.id, isValid: true, lastActivity: new Date() }
  });

  const api = axios.create({
    baseURL: 'http://localhost:3002/api/v1',
    headers: { Cookie: `access_token=${token}` }
  });

  // Get an existing lost-reason for PUT/DELETE
  const existingReason = await prisma.lostReason.findFirst();
  if (!existingReason) throw new Error('No existing lost reason');
  
  const existingId = existingReason.id;

  console.log(`\n--- POST /catalogs/lost-reasons ---`);
  try {
    const res = await api.post('/catalogs/lost-reasons', {
      code: "TEST_REASON",
      nameFa: "تست",
      nameEn: "Test"
    });
    console.log(`Status: ${res.status}`);
  } catch (e: any) {
    console.log(`Status: ${e.response?.status}`);
    console.log(JSON.stringify(e.response?.data, null, 2));
  }

  console.log(`\n--- PUT /catalogs/lost-reasons/${existingId} ---`);
  try {
    const res = await api.put(`/catalogs/lost-reasons/${existingId}`, {
      nameFa: "Updated Test"
    });
    console.log(`Status: ${res.status}`);
  } catch (e: any) {
    console.log(`Status: ${e.response?.status}`);
    console.log(JSON.stringify(e.response?.data, null, 2));
  }

  console.log(`\n--- DELETE /catalogs/lost-reasons/${existingId} ---`);
  try {
    const res = await api.delete(`/catalogs/lost-reasons/${existingId}`);
    console.log(`Status: ${res.status}`);
  } catch (e: any) {
    console.log(`Status: ${e.response?.status}`);
    console.log(JSON.stringify(e.response?.data, null, 2));
  }

  // Database verification
  console.log(`\n--- Verification ---`);
  const postCheck = await prisma.lostReason.findUnique({ where: { code: 'TEST_REASON' } });
  console.log("POST Created DB Check:", postCheck ? "FAILED - Record exists" : "PASS - No record created");
  
  const putCheck = await prisma.lostReason.findUnique({ where: { id: existingId } });
  console.log("PUT Updated DB Check:", putCheck?.nameFa === 'Updated Test' ? "FAILED - Record updated" : "PASS - Record unchanged");

  const deleteCheck = await prisma.lostReason.findUnique({ where: { id: existingId } });
  console.log("DELETE DB Check:", deleteCheck ? (deleteCheck.isActive ? "PASS - Record still active" : "FAILED - Record deactivated") : "FAILED - Record physically deleted");

  // Audit verification
  const auditCheck = await prisma.activity.findFirst({
    where: { 
      createdBy: user.id,
      metadata: { path: ['catalogType'], equals: 'lost-reasons' }
    }
  });
  console.log("Audit Check:", auditCheck ? "FAILED - Audit created" : "PASS - No audit logs created for denied actions");

  await prisma.activeSession.delete({ where: { jti: 'test-jti-rbac' } });
  await prisma.$disconnect();
}
run();
