# SPANCOP Domain Model

## Opportunity Entity

```typescript
enum SalesStage {
  SUSPECT = 'Suspect',
  PROSPECT = 'Prospect',
  ANALYSIS = 'Analysis',
  NEGOTIATE = 'Negotiate',
  CLOSE = 'Close',
  ORDER = 'Order',
  PAYMENT = 'Payment'
}

enum OpportunityStatus {
  OPEN = 'Open',
  WON = 'Won',
  LOST = 'Lost'
}

interface Opportunity {
  id: string;
  title: string;
  customerId: string;
  amount: number;
  
  // Independent Fields
  salesStage: SalesStage; 
  status: OpportunityStatus;

  // Loss Metadata
  lostReason?: string;
  competitorName?: string;
  competitorNotes?: string;
  lostAt?: Date;

  // Standard Timestamps
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date; // For Won
}
```

## State Machine Constraints
- **Initial State**: `[salesStage: SUSPECT, status: OPEN]`
- **Transition: Moving Forward**: `salesStage` updates. `status` remains `OPEN`.
- **Transition: Loss**: `status` changes to `LOST`. `salesStage` MUST remain its current value.
- **Transition: Win**: `salesStage` MUST be `PAYMENT`. `status` changes to `WON`.
- **Transition: Reopen**: `status` changes `LOST` -> `OPEN`. `salesStage` remains the same.
