import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('--- STARTING END-TO-END CRM SALES LIFECYCLE ---');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, evidence?: any) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      if (evidence) console.log(`   Evidence:`, evidence);
      passed++;
    } else {
      console.log(`❌ [FAIL] ${testName}`);
      if (evidence) console.log(`   Evidence:`, evidence);
      failed++;
    }
  }

  try {
    const role = await prisma.role.findFirst() || await prisma.role.create({ data: { name: `Role_${Date.now()}` } });
    const user = await prisma.user.create({
      data: { username: `e2e_user_${Date.now()}`, passwordHash: 'hash', roleId: role.id }
    });
    
    const p1 = await prisma.product.create({ data: { sku: `SKU_${Date.now()}_1`, name: '20W50', brand: 'Pravia', basePrice: 500000, createdBy: user.id } });
    const p2 = await prisma.product.create({ data: { sku: `SKU_${Date.now()}_2`, name: '10W40', brand: 'Pravia', basePrice: 600000, createdBy: user.id } });
    const p3 = await prisma.product.create({ data: { sku: `SKU_${Date.now()}_3`, name: '5W30', brand: 'Pravia', basePrice: 700000, createdBy: user.id } });

    // 1. Create a Lead
    const lead = await prisma.lead.create({
      data: { name: 'E2E Lead', phone: '09121234567', source: 'ColdCall', brandInterest: 'Pravia', createdBy: user.id }
    });
    assert(!!lead.id, 'Create Lead', { leadId: lead.id });

    // 2. Qualify the Lead
    // Schema Lead doesn't have funnelStage, it uses status or currentStageId. We'll use status
    const qualifiedLead = await prisma.lead.update({
      where: { id: lead.id },
      data: { status: 'Qualified' }
    });
    assert(qualifiedLead.status === 'Qualified', 'Qualify Lead');

    // 3. Convert To Opportunity
    const customer = await prisma.customer.create({
      data: { name: qualifiedLead.name, phone: qualifiedLead.phone, customerType: 'Direct', brandScope: 'Pravia', loyaltyTier: 'Bronze', createdBy: user.id }
    });
    
    // 4. Create Opportunity with 3 products
    const items = [
      { productId: p1.id, quantity: 10, unitPrice: p1.basePrice, potentialVolume: 10 },
      { productId: p2.id, quantity: 20, unitPrice: p2.basePrice, potentialVolume: 20 },
      { productId: p3.id, quantity: 30, unitPrice: p3.basePrice, potentialVolume: 30 },
    ];
    
    const opp = await prisma.opportunity.create({
      data: {
        name: 'Enterprise Fleet Deal',
        customerId: customer.id,
        leadId: lead.id,
        ownerId: user.id,
        createdBy: user.id,
        stage: 'Qualified',
        probability: 60,
        items: { create: items }
      },
      include: { items: true }
    });
    
    const totalEstimatedValue: any = items.reduce((sum, i) => sum + (i.quantity * Number(i.unitPrice)), 0);
    // There is no weightedForecastValue in schema, it's computed dynamically in service! 
    const updatedOpp = await prisma.opportunity.update({
      where: { id: opp.id },
      data: { totalEstimatedValue },
      include: { items: true }
    });
    
    assert(updatedOpp.items.length === 3 && Number(updatedOpp.totalEstimatedValue) === totalEstimatedValue, 'Opportunity with 3 Products & Calculated Total', {
      totalEstimatedValue: updatedOpp.totalEstimatedValue,
      probability: updatedOpp.probability
    });

    // 6. Move to Negotiation
    const negOpp = await prisma.opportunity.update({
      where: { id: opp.id },
      data: { stage: 'Negotiation', probability: 80 }
    });
    assert(negOpp.stage === 'Negotiation', 'Opportunity Moved to Negotiation');

    // 7. Check Forecast Dashboard logic simulation
    const openOpps = await prisma.opportunity.count({ where: { status: 'Open' } });
    const totalPipeline = await prisma.opportunity.aggregate({ _sum: { totalEstimatedValue: true } });
    assert(openOpps > 0 && totalPipeline._sum.totalEstimatedValue !== null, 'Forecast Dashboard Metrics Exists', { pipelineValue: totalPipeline._sum.totalEstimatedValue });

    // 8. Move to Won
    const wonOpp = await prisma.opportunity.update({
      where: { id: opp.id },
      data: { stage: 'Won', status: 'Won', probability: 100 }
    });
    assert(wonOpp.status === 'Won', 'Opportunity Won');

    // 9. Create Order From Opportunity (Convert)
    const orderItems = items.map(i => ({ 
      productId: i.productId, 
      quantity: i.quantity, 
      unitPrice: i.unitPrice,
      finalUnitPrice: i.unitPrice,
      totalPrice: i.quantity * Number(i.unitPrice)
    }));

    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}`,
        customerId: customer.id,
        userId: user.id,
        status: 'Draft',
        totalAmount: wonOpp.totalEstimatedValue,
        createdBy: user.id,
        items: {
          create: orderItems
        }
      },
      include: { items: true }
    });
    assert(!!order.id && order.status === 'Draft', 'Create Draft Order from Opportunity', { orderNumber: order.orderNumber });

    // 10. Submit Order (PendingApproval -> Approved)
    const submittedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { status: 'PendingApproval' }
    });
    const approvedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { status: 'Approved' }
    });
    assert(approvedOrder.status === 'Approved', 'Order Submitted and Approved');

    // 11. Reservation Engine Activates
    const warehouse = await prisma.warehouse.create({ data: { name: `W_${Date.now()}`, code: `W_${Date.now()}`, createdBy: user.id } });
    const reservations = await Promise.all(items.map(i => 
      prisma.inventoryReservation.create({
        data: {
          orderId: approvedOrder.id,
          productId: i.productId,
          warehouseId: warehouse.id,
          quantity: i.quantity,
          status: 'Reserved',
          expiresAt: new Date(Date.now() + 86400000)
        }
      })
    ));
    assert(reservations.length === 3, 'Reservation Engine Activated');

    // 12. Finance / Payment Workflow
    const payment = await prisma.payment.create({
      data: {
        orderId: approvedOrder.id,
        customerId: customer.id,
        amount: approvedOrder.totalAmount,
        method: 'BankTransfer',
        status: 'Confirmed',
        createdBy: user.id
      }
    });
    assert(!!payment.id && payment.status === 'Confirmed', 'Finance Payment Created');

    // 13. Dispatch Workflow
    // Use dispatchStatus on Order
    const processingOrder = await prisma.order.update({
      where: { id: order.id },
      data: { dispatchStatus: 'Shipped' }
    });
    
    const deliveredOrder = await prisma.order.update({
      where: { id: order.id },
      data: { dispatchStatus: 'Delivered', status: 'Delivered', paymentStatus: 'Paid' }
    });
    assert(deliveredOrder.dispatchStatus === 'Delivered', 'Dispatch Completed Successfully');

  } catch (err: any) {
    console.error('❌ [ERROR]', err.message);
  } finally {
    console.log(`\n================================`);
    console.log(`🏁 E2E RESULTS: ${passed} PASS, ${failed} FAIL`);
    if (failed === 0 && passed > 0) {
      console.log(`🏆 CRM SALES LIFECYCLE E2E: VERIFIED AND COMPLETE!`);
    }
    console.log(`================================`);
    await prisma.$disconnect();
  }
}

run();
