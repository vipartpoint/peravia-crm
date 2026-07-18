import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { OrdersService } from '../src/orders/orders.service';
import { ApprovalsService } from '../src/approvals/approvals.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { ReceivablesService } from '../src/receivables/receivables.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const prisma = app.get(PrismaService);
  const ordersService = app.get(OrdersService);
  const approvalsService = app.get(ApprovalsService);
  const receivablesService = app.get(ReceivablesService);

  console.log('--- STARTING APPROVAL WORKFLOW VERIFICATION ---');

  const ensureUser = async (roleName: string, username: string) => {
    let user = await prisma.user.findFirst({ where: { role: { name: roleName } }, include: { role: true } });
    if (!user) {
      const role = await prisma.role.upsert({ where: { name: roleName }, update: {}, create: { name: roleName } });
      user = await prisma.user.create({
        data: { username, passwordHash: 'hash', roleId: role.id },
        include: { role: true }
      }) as any;
    }
    return user;
  };

  const salesRep = await ensureUser('SalesRep', 'rep1');
  const salesManager = await ensureUser('SalesManager', 'sm1');
  const financeUser = await ensureUser('Finance', 'fin1');
  const ceoUser = await ensureUser('CEO', 'ceo1');
  
  const product = await prisma.product.findFirst();
  let customer = await prisma.customer.findFirst({ where: { status: 'Active' } });

  if (!product || !customer) {
    console.log('Missing necessary data (Product or Customer) in DB.');
    await app.close();
    return;
  }

  const approveRequest = async (entityId: string, action: 'Approved' | 'Rejected', user: any, comment = 'Looks good') => {
    const req = await prisma.approvalRequest.findFirst({ where: { entityId, status: 'Pending' } });
    if (req) {
      return approvalsService.processApproval(req.id, action, comment, user);
    }
    return null;
  };

  // Ensure credit limit is high to isolate tests
  await prisma.customer.update({ where: { id: customer.id }, data: { creditLimit: 500000000, status: 'Active' } });

  // 1. High Discount Order (Requires SalesManager + CEO)
  console.log('\n--- 1. High Discount Order (SalesManager + CEO) ---');
  let order1 = await ordersService.create({
    customerId: customer.id,
    brand: 'Gertex',
    status: 'PendingApproval',
    items: [{ productId: product.id, quantity: 1, unitPrice: 100000, discountPercent: 20 }] // 20% discount
  }, salesRep);
  
  console.log(`Order created with status: ${order1.status}`); // Should be PendingApproval
  
  let req1 = await prisma.approvalRequest.findFirst({ where: { entityId: order1.id } });
  if (req1) {
    console.log(`Approval Request Created. Roles: ${JSON.stringify(req1.requiredRoles)}, Levels: ${req1.requiredLevels}`);
  }

  try {
    await approveRequest(order1.id, 'Approved', salesRep);
  } catch (e) {
    console.log(`Self/Role check properly blocked SalesRep: ${e.message}`);
  }

  await approveRequest(order1.id, 'Approved', salesManager, 'SM Approved discount');
  req1 = await prisma.approvalRequest.findFirst({ where: { entityId: order1.id } });
  if (req1) {
    console.log(`Level 1 passed. Current Level is now: ${req1.currentLevel}`);
    if ((req1.requiredRoles as string[])[req1.currentLevel - 1] === 'Finance') {
      console.log('Finance required due to existing seed debt, approving...');
      await approveRequest(order1.id, 'Approved', financeUser, 'Finance Approved');
    }
  }

  await approveRequest(order1.id, 'Approved', ceoUser, 'CEO Approved discount');
  order1 = (await prisma.order.findUnique({ where: { id: order1.id } })) as any;
  console.log(`Final approval reached. Order status is now: ${order1.status}`); // Should be Approved

  // 2. Credit Limit Override (Requires Finance)
  console.log('\n--- 2. Credit Limit Override (Finance) ---');
  await prisma.customer.update({ where: { id: customer.id }, data: { creditLimit: 1000 } });
  
  let order2 = await ordersService.create({
    customerId: customer.id,
    brand: 'Gertex',
    status: 'PendingApproval',
    items: [{ productId: product.id, quantity: 5, unitPrice: 100000, discountPercent: 0 }] // 500k exceeds 1k
  }, salesRep);

  let req2 = await prisma.approvalRequest.findFirst({ where: { entityId: order2.id } });
  if (req2) {
    console.log(`Approval Request Created. Roles: ${JSON.stringify(req2.requiredRoles)}, Levels: ${req2.requiredLevels}`);
  }

  // Try to reject
  try {
    await approveRequest(order2.id, 'Rejected', financeUser, '');
  } catch (e) {
    console.log(`Rejection correctly blocked without comments: ${e.message}`);
  }

  await approveRequest(order2.id, 'Rejected', financeUser, 'Credit too low, please collect debt first.');
  order2 = (await prisma.order.findUnique({ where: { id: order2.id } })) as any;
  console.log(`Finance rejected. Order status is now: ${order2.status}`); // Should be Rejected

  await prisma.customer.update({ where: { id: customer.id }, data: { creditLimit: 500000000 } });

  // 3. Blocked Customer (Requires CEO)
  console.log('\n--- 3. Blocked Customer Order (CEO) ---');
  await prisma.customer.update({ where: { id: customer.id }, data: { status: 'Blocked' } });
  
  let order3 = await ordersService.create({
    customerId: customer.id,
    brand: 'Gertex',
    status: 'PendingApproval',
    items: [{ productId: product.id, quantity: 1, unitPrice: 100000, discountPercent: 0 }]
  }, salesRep);

  let req3 = await prisma.approvalRequest.findFirst({ where: { entityId: order3.id } });
  if (req3) console.log(`Approval Request Created for Blocked Customer. Roles: ${JSON.stringify(req3.requiredRoles)}`);

  while (req3 && req3.status === 'Pending') {
    const requiredRole = (req3.requiredRoles as string[])[req3.currentLevel - 1];
    const approver = requiredRole === 'Finance' ? financeUser : ceoUser;
    await approveRequest(order3.id, 'Approved', approver, `${requiredRole} approved`);
    req3 = await prisma.approvalRequest.findFirst({ where: { entityId: order3.id } });
  }

  order3 = (await prisma.order.findUnique({ where: { id: order3.id } })) as any;
  console.log(`Order status after CEO approval: ${order3.status}`); // Wait! applyApprovalDecision throws Forbidden if customer is STILL blocked!
  // Actually, our code in applyApprovalDecision checks if STILL blocked and throws Forbidden!
  // Let's see if that threw an error in background or what.
  // Actually, the catch in the script would trigger if not handled. We will test it.

  await prisma.customer.update({ where: { id: customer.id }, data: { status: 'Active' } });

  console.log('\n--- VERIFICATION COMPLETE ---');
  await app.close();
}
bootstrap().catch(e => {
    console.error('Script Error:', e);
    process.exit(1);
});
