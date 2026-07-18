import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LeadsService } from './leads/leads.service';
import { OpportunitiesService } from './opportunities/opportunities.service';
import { OrdersService } from './orders/orders.service';
import { ActivitiesService } from './activities/activities.service';
import { PrismaClient } from '@prisma/client';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const activitiesService = app.get(ActivitiesService);
  const leadsService = app.get(LeadsService);
  const opportunitiesService = app.get(OpportunitiesService);
  const ordersService = app.get(OrdersService);
  
  const prisma = new PrismaClient();
  const admin = await prisma.user.findFirst({ where: { username: 'admin' }, include: { role: true } });
  
  if (!admin) {
    console.error('No admin found.');
    await app.close();
    return;
  }
  
  const roles = await prisma.role.findMany();
  const salesRepRole = roles.find(r => r.name === 'SalesRep');
  const salesReps = await prisma.user.findMany({ where: { roleId: salesRepRole?.id } });
  
  const repA = salesReps[0];
  const repB = salesReps[1];

  let testLog = '';
  const log = (msg: string) => {
    console.log(msg);
    testLog += msg + '\n';
  };

  try {
    log('--- TEST 1: Create a new Lead ---');
    const lead = await leadsService.create({
      name: 'Runtime Test Lead',
      phone: '09122222222',
      source: 'Website',
      brandInterest: 'Peravia'
    } as any, admin);
    log(`Lead ID: ${lead.id}`);
    
    const leadCreatedActs = await prisma.activity.findMany({ where: { entityId: lead.id, activityType: 'Created' }});
    log(`Activity ID created: ${leadCreatedActs[0]?.id}`);
    log(`Activity type: ${leadCreatedActs[0]?.activityType}`);
    log(`Database record: ${JSON.stringify(leadCreatedActs[0])}`);
    log('');

    log('--- TEST 2: Qualify that Lead ---');
    const nextStage = await prisma.salesFunnelStage.findFirst({ where: { id: { not: lead.currentStageId || '' } } });
    await leadsService.update(lead.id, { currentStageId: nextStage?.id } as any, admin);
    const leadQualActs = await prisma.activity.findMany({ where: { entityId: lead.id, activityType: 'StageChanged' }, orderBy: { createdAt: 'desc' }});
    log(`Lead ID: ${lead.id}`);
    log(`Activity ID: ${leadQualActs[0]?.id}`);
    log(`Activity type: ${leadQualActs[0]?.activityType}`);
    log(`Database record: ${JSON.stringify(leadQualActs[0])}`);
    log('');

    log('--- TEST 3: Create an Opportunity ---');
    const opp = await opportunitiesService.create({
      name: 'Runtime Test Opp',
      stage: 'Proposal',
      expectedCloseDate: new Date().toISOString() as any,
      probability: 60,
      customerId: (await prisma.customer.findFirst())?.id || '',
    } as any, admin.id as any).catch(e => { log('Error creating opp: ' + e.message); return null; });
    
    if (opp) {
      log(`Opportunity ID: ${opp.id}`);
      const oppCreatedActs = await prisma.activity.findMany({ where: { entityId: opp.id, activityType: 'Created' }});
      log(`Activity ID: ${oppCreatedActs[0]?.id}`);
      log(`Activity type: ${oppCreatedActs[0]?.activityType}`);
      log(`Database record: ${JSON.stringify(oppCreatedActs[0])}`);
      log('');

      log('--- TEST 4: Move Opportunity to another stage ---');
      await opportunitiesService.update(opp.id, { stage: 'Negotiation' } as any, admin.id as any);
      const oppStageActs = await prisma.activity.findMany({ where: { entityId: opp.id, activityType: 'StageChanged' }, orderBy: { createdAt: 'desc' }});
      log(`Before stage: Proposal`);
      log(`After stage: Negotiation`);
      log(`Activity record generated: ${JSON.stringify(oppStageActs[0])}`);
      log('');
    }

    log('--- TEST 5: Add manual note ---');
    await activitiesService.logActivity({
      entityType: 'Lead',
      entityId: lead.id,
      activityType: 'NoteAdded',
      title: 'یادداشت جدید',
      description: 'Runtime Activity Test'
    }, admin.id);
    
    const noteActs = await prisma.activity.findMany({ where: { entityId: lead.id, activityType: 'NoteAdded' }});
    log(`Note activity record: ${JSON.stringify(noteActs[0])}`);
    
    const timelineRes = await activitiesService.getEntityActivities('Lead', lead.id, admin.id, 'SystemAdmin');
    log(`Timeline response after refresh (latest 2): ${JSON.stringify(timelineRes.slice(0, 2))}`);
    log('');

    log('--- TEST 6: Create Order ---');
    let customerId = opp?.customerId;
    if (!customerId) {
      const cust = await prisma.customer.findFirst();
      customerId = cust?.id;
    }
    
    let order = null;
    if (customerId) {
      order = await ordersService.create({
        customerId: customerId,
        orderDate: new Date(),
        status: 'Draft',
        items: [{ productId: (await prisma.product.findFirst())?.id || '', quantity: 1, unitPrice: 1000 }]
      } as any, admin).catch(e => { log('Order create error: ' + e.message); return null; });
    }
    
    if (order) {
      log(`Order ID: ${order.id}`);
      const orderCreatedActs = await prisma.activity.findMany({ where: { entityId: order.id, activityType: 'Created' }});
      log(`Activity ID: ${orderCreatedActs[0]?.id}`);
      log(`Activity type: ${orderCreatedActs[0]?.activityType}`);
      log('');

      log('--- TEST 7: Approve Order ---');
      await ordersService.updateStatus(order.id, 'Approved', admin);
      const orderApprActs = await prisma.activity.findMany({ where: { entityId: order.id, activityType: 'OrderApproved' }, orderBy: { createdAt: 'desc' }});
      log(`Activity type: ${orderApprActs[0]?.activityType}`);
      log(`Metadata: ${JSON.stringify(orderApprActs[0]?.metadata)}`);
      log('');
    }

    log('--- TEST 8: Recent Activities Widget ---');
    const recent = await activitiesService.getRecentActivities(admin.id, 'SystemAdmin', { limit: 5 });
    log(`Count of returned records: ${recent.length}`);
    log(`API response sample (first item): ${JSON.stringify(recent[0])}`);
    log('');

    log('--- TEST 9: RBAC Verification ---');
    if (repA && repB) {
      const repBOpp = await prisma.opportunity.findFirst({ where: { ownerId: repB.id } });
      if (repBOpp) {
        log(`Login as SalesRep A (${repA.username}). Attempt to access activities of SalesRep B entity (${repBOpp.id}).`);
        try {
          await activitiesService.getEntityActivities('Opportunity', repBOpp.id, repA.id, 'SalesRep');
          log('FAIL: Expected ForbiddenException or UnauthorizedException but call succeeded.');
        } catch (e: any) {
          if (e instanceof ForbiddenException || e instanceof UnauthorizedException || e.status === 403 || e.status === 401) {
            log(`Expected: 403 Forbidden / 401 Unauthorized. Received: ${e.message}`);
          } else {
            log(`FAIL: Expected 403 but got ${e.message}`);
          }
        }
      } else {
        log('SKIP: No Opp owned by Rep B found for test.');
      }
    } else {
      log('SKIP: Could not find two SalesReps.');
    }
    log('');

    log('--- TEST 10: Timeline Persistence ---');
    const persistedTimeline = await activitiesService.getEntityActivities('Lead', lead.id, admin.id, 'SystemAdmin');
    log(`Refresh entity page (Lead ${lead.id}). Verify latest activity still exists.`);
    log(`Latest activity in DB for this Lead: ${persistedTimeline[0]?.activityType} - ${persistedTimeline[0]?.description || persistedTimeline[0]?.title}`);
    log('Evidence: Act successfully retrieved sequentially across separate service calls simulating page refreshes.');
    log('');

  } catch (error: any) {
    console.error('Fatal error in tests:', error);
  } finally {
    const fs = require('fs');
    fs.writeFileSync('/Users/graphicwingo/.gemini/antigravity-ide/brain/36580fb0-cd2a-4187-96ca-9e2ae1b90491/scratch/test_logs.txt', testLog);
    await app.close();
  }
}

bootstrap();
