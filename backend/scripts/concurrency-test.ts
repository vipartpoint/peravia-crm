import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst();
  const customer = await prisma.customer.findFirst();

  if (!user || !customer) {
    console.error('Test requires at least 1 user and 1 customer in DB.');
    process.exit(1);
  }

  // Setup: Create dummy warehouse, product, and stock
  const warehouse = await prisma.warehouse.create({ data: { name: 'Test WH', code: 'TWH1', isActive: true, createdBy: user.id } });
  const product = await prisma.product.create({ data: { name: 'Race Condition Test Product', sku: 'PRD-TEST', category: 'TEST', brand: 'TEST', basePrice: 100, isActive: true, createdBy: user.id } });
  
  await prisma.inventoryStock.create({
    data: {
      warehouseId: warehouse.id,
      productId: product.id,
      quantityOnHand: 10, // Only 10 available
      availableQuantity: 10,
      reservedQuantity: 0,
      minStockLevel: 0,
    }
  });

  const orders = [];
  for (let i = 0; i < 15; i++) {
    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        userId: user.id,
        status: 'PendingApproval',
        totalAmount: 100,
        warehouseId: warehouse.id,
        orderNumber: `TEST-ORD-${i}`,
        createdBy: user.id,
        items: {
          create: [{ productId: product.id, quantity: 1, unitPrice: 100, finalUnitPrice: 100, totalPrice: 100 }]
        }
      }
    });
    orders.push(order);
  }

  console.log('Simulating 15 concurrent approval requests (only 10 should succeed)...');

  // Simulate concurrent approvals
  const promises = orders.map(async (order) => {
    try {
      await prisma.$transaction(async (tx) => {
        // Find item
        const item = await tx.orderItem.findFirst({ where: { orderId: order.id } });
        if (!item) throw new Error('Order item not found');
        
        // Atomic update
        const result = await tx.inventoryStock.updateMany({
          where: {
            warehouseId: warehouse.id,
            productId: item.productId,
            availableQuantity: { gte: item.quantity }
          },
          data: {
            reservedQuantity: { increment: item.quantity },
            availableQuantity: { decrement: item.quantity }
          }
        });

        if (result.count === 0) {
          throw new Error('Insufficient Stock');
        }

        await tx.order.update({
          where: { id: order.id },
          data: { status: 'Approved' }
        });
      });
      return 'Success';
    } catch (e) {
      return 'Failed';
    }
  });

  const results = await Promise.all(promises);
  
  const successCount = results.filter(r => r === 'Success').length;
  const failCount = results.filter(r => r === 'Failed').length;

  console.log(`Test Results:`);
  console.log(`Success (Approved): ${successCount}`);
  console.log(`Failed (Insufficient Stock): ${failCount}`);

  // Final check
  const finalStock = await prisma.inventoryStock.findUnique({
    where: { warehouseId_productId: { warehouseId: warehouse.id, productId: product.id } }
  });

  console.log(`Final Available Quantity: ${finalStock?.availableQuantity}`);
  console.log(`Final Reserved Quantity: ${finalStock?.reservedQuantity}`);

  if (Number(finalStock?.availableQuantity) === 0 && Number(finalStock?.reservedQuantity) === 10) {
    console.log('✅ TEST PASSED: No negative inventory, exact reservation match.');
  } else {
    console.log('❌ TEST FAILED: Race condition occurred or logic is flawed.');
  }

  // Cleanup
  await prisma.orderItem.deleteMany({ where: { order: { warehouseId: warehouse.id } } });
  await prisma.order.deleteMany({ where: { warehouseId: warehouse.id } });
  await prisma.inventoryStock.deleteMany({ where: { warehouseId: warehouse.id } });
  await prisma.product.delete({ where: { id: product.id } });
  await prisma.warehouse.delete({ where: { id: warehouse.id } });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
