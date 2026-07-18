import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting DRY RUN Migration for Sales Intelligence...');

  const lostReasons = await prisma.lostReason.findMany();
  const reopenReasons = await prisma.reopenReason.findMany();
  const competitors = await prisma.competitor.findMany();

  const otherLostReason = lostReasons.find(r => r.code === 'OTHER');
  const otherReopenReason = reopenReasons.find(r => r.code === 'OTHER');

  const opportunities = await prisma.opportunity.findMany({
    where: {
      OR: [
        { lostReason: { not: null } },
        { competitorName: { not: null } }
      ]
    }
  });

  const mappingReportLines: string[] = ['# Sales Intelligence Mapping Report\n'];
  const ambiguousRecords: any[] = [];

  let mappedLost = 0;
  let ambiguousLost = 0;
  let mappedComp = 0;
  let ambiguousComp = 0;

  for (const opp of opportunities) {
    mappingReportLines.push(`## Opportunity ID: ${opp.id}`);
    const updates: any = {};

    if (opp.lostReason) {
      const match = lostReasons.find(r => r.nameFa === opp.lostReason || r.nameEn === opp.lostReason);
      if (match) {
        updates.lostReasonId = match.id;
        updates.lostReasonCode = match.code;
        mappingReportLines.push(`- **Lost Reason:** Mapped "${opp.lostReason}" -> ${match.code}`);
        mappedLost++;
      } else {
        updates.lostReasonId = otherLostReason?.id;
        updates.lostReasonNote = opp.lostReason;
        mappingReportLines.push(`- **Lost Reason:** Unrecognized "${opp.lostReason}" -> Mapped to OTHER. Original kept in Note.`);
        ambiguousLost++;
        ambiguousRecords.push({
          type: 'LostReason',
          opportunityId: opp.id,
          originalValue: opp.lostReason
        });
      }
    }

    if (opp.competitorName) {
      const match = competitors.find(c => c.name === opp.competitorName);
      if (match) {
        updates.competitors = [{ competitorId: match.id, isPrimary: true }];
        mappingReportLines.push(`- **Competitor:** Mapped "${opp.competitorName}" -> ${match.name}`);
        mappedComp++;
      } else {
        updates.competitorNote = opp.competitorName;
        mappingReportLines.push(`- **Competitor:** Unrecognized "${opp.competitorName}" -> Fabricating avoided. Stored in competitorNote.`);
        ambiguousComp++;
        ambiguousRecords.push({
          type: 'Competitor',
          opportunityId: opp.id,
          originalValue: opp.competitorName
        });
      }
    }
    mappingReportLines.push('');
  }

  // Scan Activities for Reopen text
  const reopenActivities = await prisma.activity.findMany({
    where: { activityType: 'OpportunityReopened' }
  });

  let mappedReopen = 0;
  let ambiguousReopen = 0;

  mappingReportLines.push(`## Reopen Activities\n`);

  for (const act of reopenActivities) {
    if (act.description) {
      const reasonMatch = act.description.match(/دلیل:\s*(.*)$/);
      if (reasonMatch && reasonMatch[1]) {
        const text = reasonMatch[1].trim();
        const match = reopenReasons.find(r => r.nameFa === text || r.nameEn === text);
        if (match) {
          mappingReportLines.push(`- **Reopen Activity (${act.id}):** Mapped "${text}" -> ${match.code}`);
          mappedReopen++;
        } else {
          mappingReportLines.push(`- **Reopen Activity (${act.id}):** Unrecognized "${text}" -> Mapped to OTHER.`);
          ambiguousReopen++;
          ambiguousRecords.push({
            type: 'ReopenReason',
            activityId: act.id,
            opportunityId: act.entityId,
            originalValue: text
          });
        }
      }
    }
  }

  mappingReportLines.unshift(
    `## Summary\n` +
    `- Mapped Lost Reasons: ${mappedLost}\n` +
    `- Ambiguous Lost Reasons: ${ambiguousLost}\n` +
    `- Mapped Competitors: ${mappedComp}\n` +
    `- Ambiguous Competitors: ${ambiguousComp}\n` +
    `- Mapped Reopen Reasons: ${mappedReopen}\n` +
    `- Ambiguous Reopen Reasons: ${ambiguousReopen}\n\n`
  );

  const reportPath = path.join(__dirname, '../../SALES_INTELLIGENCE_MAPPING_REPORT.md');
  const jsonPath = path.join(__dirname, '../../SALES_INTELLIGENCE_AMBIGUOUS_RECORDS.json');
  const dryRunMdPath = path.join(__dirname, '../../SALES_INTELLIGENCE_MIGRATION_DRY_RUN.md');

  fs.writeFileSync(reportPath, mappingReportLines.join('\n'));
  fs.writeFileSync(jsonPath, JSON.stringify(ambiguousRecords, null, 2));
  fs.writeFileSync(dryRunMdPath, `# Sales Intelligence Migration - DRY RUN

## Status
**Completed Successfully (No Data Mutated)**

## Outputs
- \`SALES_INTELLIGENCE_MAPPING_REPORT.md\`: Contains line-by-line mappings of legacy text to catalog codes.
- \`SALES_INTELLIGENCE_AMBIGUOUS_RECORDS.json\`: JSON payload of records that require manual review (mapped to OTHER).

Please review the outputs before approving the real migration execution.
`);

  console.log('Dry run completed! Check the workspace root for output files.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
