# Database Refactor Plan

## 1. Schema Updates (Prisma)
Modify the `Opportunity` model in `schema.prisma`.

```prisma
enum OpportunityStatus {
  OPEN
  WON
  LOST
}

model Opportunity {
  // Existing fields...
  id          String   @id @default(cuid())
  
  // Decoupled Stage and Status
  salesStage  String   // Must map to Suspect, Prospect, Analysis, Negotiate, Close, Order, Payment
  status      OpportunityStatus @default(OPEN)
  
  // Lost Reason Metadata
  lostReason      String?
  competitorName  String?
  competitorNotes String?
  lostAt          DateTime?

  // Standard Tracking
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  closedAt    DateTime?
}
```

## 2. Migration Strategy
1. **Add new fields**: Add `status`, `lostReason`, `competitorName`, `competitorNotes`, `lostAt`.
2. **Data Backfill**: 
   - Opportunities where `salesStage == 'Lost'` should be mapped: `status = LOST`. Their `salesStage` should revert to the stage they were in prior to loss, or default to `Suspect` if history is missing.
   - Opportunities where `salesStage == 'Won'` should be mapped: `status = WON`, `salesStage = Payment`.
   - Ensure remaining values for `salesStage` are normalized strictly to the 7 canonical SPANCOP values.
3. **Validation logic**: Add Prisma middleware or service-level guards enforcing transitions (e.g. `WON` only permitted if `salesStage == 'Payment'`).
