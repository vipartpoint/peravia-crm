const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();
const api = axios.create({ baseURL: 'http://localhost:3000/api/v1' });

async function runTests() {
  console.log('--- STARTING NOTIFICATIONS TESTS ---');
  let userA, userB;
  try {
    userA = await prisma.user.findFirst({ where: { role: { name: 'SystemAdmin' } } });
    userB = await prisma.user.findFirst({ where: { role: { name: 'SalesRep' } } });
    
    const jwt = require('jsonwebtoken');
    const secret = 'super-secret-jwt-key-replace-in-production';
    
    // Login User A
    const tokenA = jwt.sign({ sub: userA.id, username: userA.username, role: 'SystemAdmin' }, secret, { expiresIn: '1d' });
    
    // Login User B
    const tokenB = jwt.sign({ sub: userB.id, username: userB.username, role: 'SalesRep' }, secret, { expiresIn: '1d' });

    const apiA = axios.create({ baseURL: 'http://localhost:3000/api/v1', headers: { Cookie: `access_token=${tokenA}` } });
    const apiB = axios.create({ baseURL: 'http://localhost:3000/api/v1', headers: { Cookie: `access_token=${tokenB}` } });

    console.log('\\n[Test 1] Mark single notification as read');
    // Create unread
    const notif1 = await prisma.notification.create({
      data: {
        userId: userA.id,
        title: 'Test 1',
        message: 'Message 1',
        type: 'Info',
        status: 'Unread',
        priority: 'Low',
        entityType: 'System',
        entityId: '1'
      }
    });
    console.log('Created ID:', notif1.id);
    
    await apiA.patch(`/notifications/${notif1.id}/read`);
    const check1 = await prisma.notification.findUnique({ where: { id: notif1.id } });
    console.log('Status after read:', check1.status);
    console.log('ReadAt:', !!check1.readAt);

    console.log('\\n[Test 2] Mark all as read');
    await prisma.notification.create({ data: { userId: userA.id, title: 'Test 2A', message: 'M', type: 'Info', status: 'Unread', priority: 'Low', entityType: 'System', entityId: '2' } });
    await prisma.notification.create({ data: { userId: userA.id, title: 'Test 2B', message: 'M', type: 'Info', status: 'Unread', priority: 'Low', entityType: 'System', entityId: '3' } });
    
    const unreadCountBefore = await apiA.get('/notifications/unread-count');
    console.log('Unread before read-all:', unreadCountBefore.data.unreadCount);
    await apiA.patch('/notifications/read-all');
    const unreadCountAfter = await apiA.get('/notifications/unread-count');
    console.log('Unread after read-all:', unreadCountAfter.data.unreadCount);

    console.log('\\n[Test 3] Archive notification');
    const notif3 = await prisma.notification.create({
      data: { userId: userA.id, title: 'Test 3', message: 'M', type: 'Info', status: 'Unread', priority: 'Low', entityType: 'System', entityId: '4' }
    });
    await apiA.patch(`/notifications/${notif3.id}/archive`);
    const check3 = await prisma.notification.findUnique({ where: { id: notif3.id } });
    console.log('Status after archive:', check3.status);

    console.log('\\n[Test 4] RBAC access control');
    const notifA = await prisma.notification.create({
      data: { userId: userA.id, title: 'Test A', message: 'M', type: 'Info', status: 'Unread', priority: 'Low', entityType: 'System', entityId: '5' }
    });
    try {
      await apiB.get(`/notifications/${notifA.id}`);
      console.log('FAIL: User B accessed User A notification');
    } catch (e) {
      console.log('PASS: User B got error accessing User A notification:', e.response?.status);
    }
    
    try {
      await apiB.patch(`/notifications/${notifA.id}/read`);
      console.log('FAIL: User B patched User A notification');
    } catch (e) {
      console.log('PASS: User B got error patching User A notification:', e.response?.status);
    }
    
    console.log('\\n[Test 5] Fingerprint deduplication');
    await prisma.notification.create({ data: { userId: userA.id, title: 'Dup', message: '1', type: 'Info', status: 'Unread', priority: 'Low', fingerprint: 'dedup-123' }});
    const dup2 = await apiA.post('/notifications', { title: 'Dup', message: '2', type: 'Info', priority: 'Low', fingerprint: 'dedup-123' }).catch(e => null);
    // Actually our POST doesn't accept fingerprint directly if the service handles it internally in hooks,
    // let's do it via the Activities or hooks, or manually via Prisma to see if the hook logic deduplicates.
    // Wait, deduplication is inside the service, so let's use the NotificationsService from Nest!
    // Since we are external, I'll write a NestJS standalone script to test this next.
    console.log('Test 5 will be verified via NestJS execution.');
    
    console.log('\\n[Test 6] Cheque due soon notification');
    console.log('Test 6 will be verified via NestJS execution.');

    console.log('\\nALL EXTERNAL HTTP TESTS DONE');

  } catch (error) {
    console.error(error.response?.data || error.message);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
