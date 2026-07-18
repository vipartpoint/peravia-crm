import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { CustomerPortalService } from '../src/customer-portal/customer-portal.service';
import { CustomerPortalController } from '../src/customer-portal/customer-portal.controller';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const portalService = app.get(CustomerPortalService);
  const portalController = app.get(CustomerPortalController);

  console.log('--- STARTING CUSTOMER PORTAL VERIFICATION ---');

  // Find a valid order and customer
  const order = await prisma.order.findFirst({
    include: { customer: true }
  });

  if (!order) {
    console.log('Missing data.');
    await app.close();
    return;
  }

  const primaryPhone = order.customer.phone || '09121112233';
  if (!order.customer.phone) {
     await prisma.customer.update({ where: { id: order.customerId }, data: { phone: primaryPhone } });
  }

  // Test 1: Valid Verification
  console.log(`\n--- 1. Valid Verification ---`);
  const { trackingToken } = await portalController.verifyOrder({ orderNumber: order.orderNumber, mobile: primaryPhone });
  console.log(`Tracking Token generated successfully.`);

  // Decode token to verify contents
  const jwtService = app.get(JwtService);
  // Decode ignoring expiration to just verify payload
  const decoded = jwtService.decode(trackingToken) as any;
  if (!decoded || decoded.purpose !== 'customer_portal_tracking' || !decoded.orderId || decoded.mobile) {
      console.log('Error: Token payload does not match requirements!');
      console.log(decoded);
  } else {
      console.log('Token payload verified (no PII, correct purpose).');
  }

  // Test 2: Invalid Mobile
  console.log(`\n--- 2. Invalid Mobile Verification ---`);
  try {
      await portalController.verifyOrder({ orderNumber: order.orderNumber, mobile: '09999999999' });
      console.log('ERROR: Should have thrown Unauthorized');
  } catch (e: any) {
      console.log(`Successfully blocked invalid mobile: ${e.message}`);
  }

  // Test 3: Track Endpoints
  console.log(`\n--- 3. Tracking Endpoints ---`);
  const reqMock = { portalUser: decoded } as any;

  const summary = await portalController.getOrderSummary(reqMock);
  console.log('Summary:', summary);

  const status = await portalController.getOrderStatus(reqMock);
  console.log('Status Timeline Current:', status.currentStatus);

  const items = await portalController.getOrderItems(reqMock);
  console.log('Items Count:', items.length);

  const financials = await portalController.getCustomerFinancials(reqMock);
  console.log('Financials (Paid Amount):', financials.paidAmount);

  // Test 4: Internal Data Shield
  console.log(`\n--- 4. Internal Data Verification ---`);
  const hasRiskOrInternalIds = Object.keys(summary).some(k => k.toLowerCase().includes('id') && k !== 'orderNumber') ||
                               Object.keys(financials).some(k => k.toLowerCase().includes('risk') || k.toLowerCase().includes('audit'));
  if (hasRiskOrInternalIds) {
      console.log('ERROR: Internal data exposed!');
  } else {
      console.log('Confirmed: No internal data exposed in API responses.');
  }

  console.log('\n--- VERIFICATION COMPLETE ---');
  await app.close();
}

bootstrap().catch(err => {
  console.error('Script Error:', err);
  process.exit(1);
});
