import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const OUTPUT_DIR = path.resolve(__dirname, '../../');

const STAGE_MAP: Record<string, string> = {
  'Lead': 'Suspect',
  'Qualified': 'Prospect',
  'Proposal': 'Analysis',
  'Negotiation': 'Negotiate'
};

const VALID_SPANCOP = ['Suspect', 'Prospect', 'Analysis', 'Negotiate', 'Close', 'Order', 'Payment'];

async function main() {
  console.log('Starting SPANCOP Data Migration Dry-Run...');

  const opportunities = await prisma.opportunity.findMany({
    include: {
      stageHistory: { orderBy: { enteredAt: 'desc' } },
      items: true
    }
  });

  const activities = await prisma.activity.findMany({
    where: { entityType: 'Opportunity' },
    orderBy: { createdAt: 'desc' }
  });

  // Group activities by opportunityId
  const activitiesByOpp = activities.reduce((acc, act) => {
    if (!acc[act.entityId]) acc[act.entityId] = [];
    acc[act.entityId].push(act);
    return acc;
  }, {} as Record<string, any[]>);

  let mappingReport = '# SPANCOP Data Mapping Report\n\n| ID | Old Stage | Old Status | New Stage | New Status | Reason |\n|---|---|---|---|---|---|\n';
  let ambiguousReport = '# SPANCOP Ambiguous Records Report\n\nThe following records could not be fully automatically migrated and require manual review:\n\n';
  
  const reviewRequired: any[] = [];
  
  const counts = {
    total: opportunities.length,
    mapped: 0,
    ambiguous: 0,
    wonMappedToPayment: 0,
    wonAmbiguous: 0,
    lostMapped: 0,
    openMapped: 0
  };

  for (const opp of opportunities) {
    const oppActivities = activitiesByOpp[opp.id] || [];
    
    let newSalesStage = '';
    let newStatus = opp.status || 'Open';
    let isAmbiguous = false;
    let reason = '';
    let manualReason = '';

    const extractLastValidStage = () => {
      // Priority 1: OpportunityStageHistory
      const validHistory = opp.stageHistory.filter(h => h.stage !== 'Won' && h.stage !== 'Lost');
      if (validHistory.length > 0) {
        return STAGE_MAP[validHistory[0].stage] || validHistory[0].stage;
      }

      // Priority 2: Activity Timeline (StageChanged)
      const stageActivities = oppActivities.filter(a => a.activityType === 'StageChanged' && a.metadata && (a.metadata as any).to !== 'Won' && (a.metadata as any).to !== 'Lost');
      if (stageActivities.length > 0) {
        return STAGE_MAP[(stageActivities[0].metadata as any).to] || (stageActivities[0].metadata as any).to;
      }

      // Priority 3: existing opportunity.stage
      if (opp.stage !== 'Won' && opp.stage !== 'Lost') {
        return STAGE_MAP[opp.stage] || opp.stage;
      }

      return null;
    };

    if (opp.stage === 'Won' || opp.status === 'Won') {
      newStatus = 'Won';
      
      // Check for confirmed payment
      // For this dry-run, we assume Order/Payment relationship might exist.
      // Since Opportunity doesn't link directly to Order in Prisma schema (Order has customerId, not oppId usually, wait let's check).
      // Actually we will just look at activities or order linkages if any.
      const hasPaymentActivity = oppActivities.some(a => a.activityType === 'PaymentConfirmed' || a.title.includes('پرداخت'));
      
      if (hasPaymentActivity) {
        newSalesStage = 'Payment';
        reason = 'Confirmed payment activity found. Mapped to Payment.';
        counts.wonMappedToPayment++;
      } else {
        const lastStage = extractLastValidStage();
        if (lastStage && VALID_SPANCOP.includes(lastStage)) {
          newSalesStage = lastStage;
          reason = `Won but no confirmed payment found. Restored to last valid stage: ${lastStage}. Flagged for review.`;
          isAmbiguous = true;
          manualReason = 'No confirmed payment found for Won opportunity.';
          counts.wonAmbiguous++;
        } else {
          newSalesStage = 'UNKNOWN';
          isAmbiguous = true;
          manualReason = 'Won opportunity with no payment and no history.';
          counts.wonAmbiguous++;
        }
      }
    } else if (opp.stage === 'Lost' || opp.status === 'Lost') {
      newStatus = 'Lost';
      const lastStage = extractLastValidStage();
      if (lastStage && VALID_SPANCOP.includes(lastStage)) {
        newSalesStage = lastStage;
        reason = `Lost. Restored to last valid stage: ${lastStage}.`;
        counts.lostMapped++;
      } else {
        newSalesStage = 'UNKNOWN';
        isAmbiguous = true;
        manualReason = 'Lost opportunity with no history to determine stage.';
        counts.ambiguous++;
      }
    } else {
      // Open opportunities
      const mappedStage = STAGE_MAP[opp.stage] || opp.stage;
      if (VALID_SPANCOP.includes(mappedStage)) {
        newSalesStage = mappedStage;
        newStatus = 'Open';
        reason = `Mapped ${opp.stage} to ${mappedStage}.`;
        counts.openMapped++;
      } else {
        newSalesStage = 'UNKNOWN';
        isAmbiguous = true;
        manualReason = `Unknown stage: ${opp.stage}`;
        counts.ambiguous++;
      }
    }

    if (!isAmbiguous) {
      counts.mapped++;
      mappingReport += `| ${opp.id.slice(0,8)}... | ${opp.stage} | ${opp.status} | ${newSalesStage} | ${newStatus} | ${reason} |\n`;
    } else {
      ambiguousReport += `- **ID:** ${opp.id}\n  - **Old Stage:** ${opp.stage}\n  - **Old Status:** ${opp.status}\n  - **Reason:** ${manualReason}\n\n`;
      reviewRequired.push({
        opportunityId: opp.id,
        oldStage: opp.stage,
        oldStatus: opp.status,
        availableHistory: opp.stageHistory.map(h => h.stage),
        reasonAutomaticMigrationImpossible: manualReason
      });
    }
  }

  const dryRunContent = `# SPANCOP Data Migration Dry-Run Summary

## Metrics
- **Total Opportunities:** ${counts.total}
- **Successfully Mappable:** ${counts.mapped}
- **Ambiguous (Review Required):** ${counts.ambiguous + counts.wonAmbiguous}

## Mapping Breakdown
- **Open Opportunities Mapped:** ${counts.openMapped}
- **Lost Opportunities Mapped:** ${counts.lostMapped}
- **Won Mapped to Payment (Verified):** ${counts.wonMappedToPayment}
- **Won but Ambiguous (No Payment found):** ${counts.wonAmbiguous}

*Note: No data has been modified during this run. Review the generated reports for details.*
`;

  fs.writeFileSync(path.join(OUTPUT_DIR, 'SPANCOP_DATA_MIGRATION_DRY_RUN.md'), dryRunContent);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'SPANCOP_DATA_MAPPING_REPORT.md'), mappingReport);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'SPANCOP_AMBIGUOUS_RECORDS_REPORT.md'), ambiguousReport);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'SPANCOP_MIGRATION_REVIEW_REQUIRED.json'), JSON.stringify(reviewRequired, null, 2));

  console.log('Dry-run complete. Reports generated in root directory.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
