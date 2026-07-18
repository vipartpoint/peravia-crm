import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PaymentsService } from '../src/payments/payments.service';
import { ChequesService } from '../src/cheques/cheques.service';
import { OrdersService } from '../src/orders/orders.service';
import { ReceivablesService } from '../src/receivables/receivables.service';
import { FinancialAlertsService } from '../src/financial/financial-alerts.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { EncryptionUtil } from '../src/utils/encryption.util';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const prisma = app.get(PrismaService);
  const paymentsService = app.get(PaymentsService);
  const chequesService = app.get(ChequesService);
  const ordersService = app.get(OrdersService);
  const receivablesService = app.get(ReceivablesService);
  const alertsService = app.get(FinancialAlertsService);

  console.log('--- STARTING FINANCIAL ENGINE VERIFICATION ---');

  // 1. Setup Mock Users and Customer
  const salesRep = await prisma.user.findFirst({ where: { role: { name: 'SalesRep' } }, include: { role: true } });
  const financeUser = await prisma.user.findFirst({ where: { role: { name: 'Finance' } }, include: { role: true } });
  const ceoUser = await prisma.user.findFirst({ where: { role: { name: 'CEO' } }, include: { role: true } });
  const product = await prisma.product.findFirst();
  let customer = await prisma.customer.findFirst({ where: { status: 'Active' } });

  if (!salesRep || !financeUser || !product || !customer) {
    console.log('Missing necessary data (SalesRep, FinanceUser, Product, or Customer) in DB.');
    await app.close();
    return;
  }
  
  const overrideUser = ceoUser || financeUser;

  // 2. Create Order as SalesRep (Small amount)
  console.log('\n--- 2. Create Order (Small Amount) ---');
  let order1: any = await ordersService.create({
    customerId: customer.id,
    brand: 'Gertex',
    status: 'Draft',
    items: [
      { productId: product.id, quantity: 1, unitPrice: 100000, discountPercent: 0 }
    ]
  }, salesRep);
  console.log('Order created:', order1.orderNumber, 'NetAmount:', order1.netAmount, 'Status:', order1.status);

  // Approve order as Finance
  order1 = await ordersService.updateStatus(order1.id, 'Approved', financeUser);
  console.log('Order approved. PaymentStatus:', order1.paymentStatus); // Unpaid

  // 3. Create Payment as SalesRep
  console.log('\n--- 3. Create & Process Payment ---');
  let payment1 = await paymentsService.create({
    customerId: customer.id,
    orderId: order1.id,
    amount: 50000,
    method: 'BankTransfer',
    referenceNumber: 'REF123456',
    paymentDate: new Date()
  }, salesRep);
  console.log('Payment created by SalesRep. Status:', payment1.status); // Pending

  // Attempt to confirm as SalesRep (should fail)
  try {
    await paymentsService.updateStatus(payment1.id, 'Confirmed', salesRep);
  } catch (e) {
    console.log('SalesRep failed to confirm payment as expected:', e.message);
  }

  // Confirm as Finance
  payment1 = await paymentsService.updateStatus(payment1.id, 'Confirmed', financeUser);
  console.log('Payment confirmed by Finance. Status:', payment1.status);

  // Check Order Payment Status Sync
  order1 = await prisma.order.findUnique({ where: { id: order1.id } });
  console.log(`Order Sync: Collected=${order1.collectedAmount}, Uncollected=${order1.uncollectedAmount}, Status=${order1.paymentStatus}`);

  // 4. Cheque Lifecycle
  console.log('\n--- 4. Cheque Lifecycle ---');
  let cheque1 = await chequesService.create({
    customerId: customer.id,
    orderId: order1.id,
    chequeNumber: 'CHQ98765',
    bankName: 'Mellat',
    amount: 50000,
    dueDate: new Date(),
  }, null as any, financeUser); // no file
  console.log('Cheque registered. Status:', cheque1.status);
  
  // Clear cheque
  cheque1 = await chequesService.updateStatus(cheque1.id, 'Cleared', financeUser);
  console.log('Cheque cleared.');
  order1 = await prisma.order.findUnique({ where: { id: order1.id } });
  console.log(`Order Sync (Cheque Cleared): Collected=${order1.collectedAmount}, Uncollected=${order1.uncollectedAmount}, Status=${order1.paymentStatus}`);

  // Bounce cheque
  cheque1 = await chequesService.updateStatus(cheque1.id, 'Bounced', financeUser);
  console.log('Cheque bounced!');
  order1 = await prisma.order.findUnique({ where: { id: order1.id } });
  console.log(`Order Sync (Cheque Bounced): Collected=${order1.collectedAmount}, Uncollected=${order1.uncollectedAmount}, Status=${order1.paymentStatus}`);

  // 5. Receivables Recalculation
  console.log('\n--- 5. Receivables Recalculation ---');
  const receivables = await receivablesService.getCustomerRiskAndCredit(customer.id);
  if (receivables) {
    console.log('Receivables Risk Status:', receivables.riskStatus);
    console.log('Total Unpaid:', receivables.totalUnpaidAmount);
    console.log('Bounced Amount:', receivables.bouncedChequeAmount);
    console.log('Remaining Credit:', receivables.remainingCredit);
  }

  // 6. Credit Limit Enforcement
  console.log('\n--- 6. Credit Limit Enforcement ---');
  // Set customer credit limit low temporarily
  await prisma.customer.update({ where: { id: customer.id }, data: { creditLimit: 20000 } });
  
  let order2: any = await ordersService.create({
    customerId: customer.id,
    brand: 'Gertex',
    status: 'Approved', // SalesRep tries to force approve
    items: [
      { productId: product.id, quantity: 5, unitPrice: 100000, discountPercent: 0 } // NetAmount = 500000 (Exceeds 20000)
    ]
  }, salesRep);
  console.log('Order created exceeding credit limit. Status forced to:', order2.status); // Should be PendingApproval

  // Attempt to approve as Sales Rep (fails)
  try {
    await ordersService.updateStatus(order2.id, 'Approved', salesRep, 'Please approve');
  } catch (e) {
    console.log('SalesRep failed to override credit limit as expected:', e.message);
  }

  // Override as overrideUser (CEO or Finance)
  order2 = await ordersService.updateStatus(order2.id, 'Approved', overrideUser, 'Override for testing');
  console.log('User successfully overrode credit limit. Order status:', order2.status);

  // Restore credit limit
  await prisma.customer.update({ where: { id: customer.id }, data: { creditLimit: 500000000 } });

  // 7. Blocked Customer Test
  console.log('\n--- 7. Blocked Customer Constraint ---');
  await prisma.customer.update({ where: { id: customer.id }, data: { status: 'Blocked' } });
  try {
    await ordersService.create({
      customerId: customer.id,
      brand: 'Pravia',
      status: 'Draft',
      items: [{ productId: product.id, quantity: 1, unitPrice: 100, discountPercent: 0 }]
    }, salesRep);
  } catch (e) {
    console.log('Blocked customer correctly rejected:', e.message);
  }
  await prisma.customer.update({ where: { id: customer.id }, data: { status: 'Active' } });

  // 8. Alerts Verification
  console.log('\n--- 8. Financial Alerts ---');
  await alertsService.checkAllAlerts();
  console.log('Alerts generated. Checking notifications table...');
  const alerts = await prisma.notification.findMany({
    where: { entityType: 'Cheque' },
    orderBy: { createdAt: 'desc' },
    take: 3
  });
  alerts.forEach(a => console.log(`Alert Generated: [${a.priority}] ${a.title} - ${a.message}`));

  console.log('\n--- VERIFICATION COMPLETE ---');
  await app.close();
}
bootstrap();
