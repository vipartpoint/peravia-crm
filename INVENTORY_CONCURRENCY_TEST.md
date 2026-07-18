# INVENTORY CONCURRENCY TEST REPORT

This report proves the mitigation of the TOCTOU (Time-Of-Check to Time-Of-Use) race condition in the Inventory Reservation module.

## The Problem
Under high load, reading available stock into memory and subsequently updating the database allows multiple concurrent transactions to read the same initial value, resulting in negative available stock and overselling.

## The Remediation
The logic was migrated from `findUnique -> update` to an atomic `updateMany` combined with a condition inside the database engine:
```typescript
const result = await tx.inventoryStock.updateMany({
  where: {
    warehouseId,
    productId,
    availableQuantity: { gte: quantity } // Atomic Check
  },
  data: {
    reservedQuantity: { increment: quantity },
    availableQuantity: { decrement: quantity }
  }
});

if (result.count === 0) throw new BadRequestException('Insufficient stock');
```
This forces PostgreSQL to handle row locks and ensure conditions are met exactly at the time of write.

## Test Results
A concurrency script (`backend/scripts/concurrency-test.ts`) was executed:
- **Setup:** A product was created with `10` available items.
- **Action:** 15 asynchronous and concurrent processes attempted to reserve 1 item each.
- **Expected Outcome:** 10 processes succeed, 5 processes fail gracefully. Available stock drops to exactly 0, and not below.

### Output
```text
Starting Inventory Concurrency Test...
Simulating 15 concurrent approval requests (only 10 should succeed)...
Test Results:
Success (Approved): 10
Failed (Insufficient Stock): 5
Final Available Quantity: 0
Final Reserved Quantity: 10
✅ TEST PASSED: No negative inventory, exact reservation match.
```

**Status:** SECURED. No risk of overselling remains.
