const fs = require('fs');
const path = require('path');

const schemaPath = path.join('/Volumes', 'HDD External', 'my', 'sahar davari', 'CRM project', 'backend', 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf-8');

if (!schema.includes('model Opportunity {')) {
  // Add to User
  schema = schema.replace(
    'smsProviders        SmsProviderConfig[]',
    'smsProviders        SmsProviderConfig[]\n  opportunitiesOwned Opportunity[] @relation("OpportunityOwner")\n  opportunitiesCreated Opportunity[] @relation("OpportunityCreator")'
  );

  // Add to Territory
  schema = schema.replace(
    'kpiTargets KPITarget[]',
    'kpiTargets KPITarget[]\n  opportunities Opportunity[]'
  );

  // Add to Customer
  schema = schema.replace(
    'payments      Payment[]',
    'payments      Payment[]\n  opportunities Opportunity[]'
  );

  // Add to Lead
  schema = schema.replace(
    'visits        Visit[]',
    'visits        Visit[]\n  opportunity   Opportunity?'
  );

  // Add to Product
  schema = schema.replace(
    'stockTransfers   StockTransferRequest[]',
    'stockTransfers   StockTransferRequest[]\n  opportunityItems OpportunityItem[]'
  );

  // Add the new models at the end of the file
  const newModels = `
model Opportunity {
  id               String    @id @default(uuid())
  name             String
  customerId       String
  leadId           String?   @unique
  territoryId      String?
  ownerId          String
  totalEstimatedValue Decimal @default(0.0)
  totalPotentialVolume Decimal @default(0.0)
  probability      Int       @default(10)
  expectedCloseDate DateTime?
  notes            String?   @db.Text
  stage            String    @default("Lead") // Lead, Qualified, Proposal, Negotiation, Won, Lost
  status           String    @default("Open") // Open, Won, Lost
  lostReason       String?
  competitorName   String?
  competitorNotes  String?   @db.Text
  nextAction       String?
  followUpDate     DateTime?
  reminderStatus   String    @default("Pending") // Pending, Sent, Dismissed
  
  createdBy        String
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  deletedAt        DateTime?
  deletedBy        String?

  customer         Customer  @relation(fields: [customerId], references: [id])
  lead             Lead?     @relation(fields: [leadId], references: [id])
  territory        Territory? @relation(fields: [territoryId], references: [id])
  owner            User      @relation("OpportunityOwner", fields: [ownerId], references: [id])
  creator          User      @relation("OpportunityCreator", fields: [createdBy], references: [id])

  items            OpportunityItem[]
  stageHistory     OpportunityStageHistory[]
}

model OpportunityItem {
  id              String  @id @default(uuid())
  opportunityId   String
  productId       String
  quantity        Int
  potentialVolume Decimal @default(0.0)
  unitPrice       Decimal @default(0.0)
  estimatedValue  Decimal @default(0.0)

  opportunity     Opportunity @relation(fields: [opportunityId], references: [id], onDelete: Cascade)
  product         Product     @relation(fields: [productId], references: [id])
}

model OpportunityStageConfig {
  id          String   @id @default(uuid())
  name        String   @unique
  probability Int
  order       Int
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model OpportunityStageHistory {
  id            String    @id @default(uuid())
  opportunityId String
  stage         String
  enteredAt     DateTime  @default(now())
  leftAt        DateTime?
  durationDays  Float?
  changedBy     String

  opportunity   Opportunity @relation(fields: [opportunityId], references: [id], onDelete: Cascade)
  user          User        @relation(fields: [changedBy], references: [id])
}
`;

  schema += newModels;
  fs.writeFileSync(schemaPath, schema, 'utf-8');
  console.log('Successfully patched schema.prisma');
} else {
  console.log('Schema already contains Opportunity model.');
}
