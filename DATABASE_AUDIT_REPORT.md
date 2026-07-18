# DATABASE AUDIT REPORT

This report analyzes the Prisma schema, indexing strategies, and relational integrity.

## 1. Race Conditions in Inventory Reservation (TOCTOU)
- **Severity:** Critical
- **Affected Schema:** `InventoryStock`, `Order`
- **Why it matters:** The current stock reservation reads `availableQuantity`, checks if it's sufficient in memory, and then updates the DB. In high concurrency, two orders could read the same available stock, resulting in negative actual stock.
- **Risk Impact:** Fulfillment failure, financial loss, negative inventory corruption.
- **Recommended Fix:** Do not read-then-write. Use Prisma's atomic `decrement` operator within a transaction, and catch the database constraint error if it drops below zero.
  ```typescript
  // Remediation Code
  await prisma.inventoryStock.update({
    where: { id: stockId },
    data: { reservedQuantity: { increment: orderQty } } // Requires a DB CHECK constraint >= 0
  });
  ```

## 2. Lack of Row-Level Security (RLS)
- **Severity:** High
- **Affected Schema:** Global
- **Why it matters:** We rely entirely on the application layer to separate data by Territory or SalesRep.
- **Risk Impact:** A single SQL injection or application logic flaw exposes the entire database.
- **Recommended Fix:** Since PostgreSQL is used, implement true Postgres RLS policies linked to a session variable set by Prisma before executing queries.

## 3. Absence of Financial Double-Entry Ledger
- **Severity:** High
- **Affected Schema:** `Cheque`, `Payment`, `Receivable`
- **Why it matters:** The system updates balances directly (e.g., `Receivable.totalAmount`). 
- **Risk Impact:** Inability to accurately audit financial history if an update fails or is manipulated.
- **Recommended Fix:** Introduce an immutable `JournalEntry` and `LedgerTransaction` table. Balances should ideally be calculated (or materialized) from immutable ledger lines rather than directly mutated.

## 4. Missing Database-Level Constraints
- **Severity:** Medium
- **Affected Schema:** `Customer`
- **Why it matters:** Validation (like unique national ID or phone number) relies mostly on application logic.
- **Risk Impact:** Race conditions could result in duplicate customers.
- **Recommended Fix:** Add `@@unique([nationalId])` and `@@unique([phoneNumber])` directly in the Prisma schema.
