import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeadScoreEngine } from './engines/lead-score.engine';
import { ChurnRiskEngine } from './engines/churn-risk.engine';
import { CustomerHealthEngine } from './engines/customer-health.engine';
import { OpportunityDetectionEngine } from './engines/opportunity-detection.engine';
import { ManagerAlertsEngine } from './engines/manager-alerts.engine';
import { AIExplanationAdapter } from './engines/ai-explanation.adapter';
import * as crypto from 'crypto';

@Injectable()
export class AiInsightsService {
  constructor(
    private prisma: PrismaService,
    private leadScore: LeadScoreEngine,
    private churnRisk: ChurnRiskEngine,
    private customerHealth: CustomerHealthEngine,
    private opportunityDetection: OpportunityDetectionEngine,
    private managerAlerts: ManagerAlertsEngine,
    private explanationAdapter: AIExplanationAdapter
  ) {}

  async recalculate(user: any) {
    // 1. Run all deterministic engines
    const allInsights = [];
    allInsights.push(...await this.leadScore.calculateAll());
    allInsights.push(...await this.churnRisk.calculateAll());
    allInsights.push(...await this.customerHealth.calculateAll());
    allInsights.push(...await this.opportunityDetection.calculateAll());
    allInsights.push(...await this.managerAlerts.calculateAll());

    // Enrich High/Medium Priority Insights with LLM
    let enrichmentCount = 0;
    const limit = parseInt(process.env.AI_ENRICHMENT_LIMIT || '20', 10);
    let llmUsed = false;

    // We sort to prioritize high risk/opportunities
    allInsights.sort((a, b) => (b.priority === 'High' ? 1 : 0) - (a.priority === 'High' ? 1 : 0));

    // Upsert insights into DB
    const results = [];
    for (const insight of allInsights) {
      // Create a deterministic hash of the score and description to detect changes
      const snapshotHash = crypto.createHash('sha256').update(`${insight.score}_${insight.insightDescription}`).digest('hex');
      (insight as any).inputSnapshotHash = snapshotHash;

      // Check Cache
      const existing = await this.prisma.aIInsight.findUnique({
        where: { insightType_entityType_entityId: { insightType: insight.insightType, entityType: insight.entityType, entityId: insight.entityId } }
      });

      const existingHash = existing?.inputSnapshotHash || null;
      const needsEnrichment = !existing || existingHash !== snapshotHash || existing.modelName.includes('RuleBased') || existing.modelName.includes('Deterministic');

      if (needsEnrichment && (insight.priority === 'High' || insight.priority === 'Medium') && enrichmentCount < limit) {
        await this.explanationAdapter.enrichInsight(insight);
        enrichmentCount++;
        llmUsed = insight.modelName.includes('LLM');
      } else if (existing && existingHash === snapshotHash && existing.modelName.includes('LLM')) {
        // Restore cached LLM description
        insight.insightDescription = existing.insightDescription || '';
        insight.modelName = existing.modelName;
      }

      const saved = await this.prisma.aIInsight.upsert({
        where: {
          insightType_entityType_entityId: {
            insightType: insight.insightType,
            entityType: insight.entityType,
            entityId: insight.entityId
          }
        },
        update: {
          score: insight.score,
          priority: insight.priority,
          insightTitle: insight.insightTitle,
          insightDescription: insight.insightDescription,
          recommendedAction: insight.recommendedAction,
          modelName: insight.modelName,
          modelVersion: insight.modelVersion,
          inputSnapshotHash: (insight as any).inputSnapshotHash || null,
          status: insight.status
        },
        create: {
          insightType: insight.insightType,
          entityType: insight.entityType,
          entityId: insight.entityId,
          score: insight.score,
          priority: insight.priority,
          insightTitle: insight.insightTitle,
          insightDescription: insight.insightDescription,
          recommendedAction: insight.recommendedAction,
          modelName: insight.modelName,
          modelVersion: insight.modelVersion,
          inputSnapshotHash: (insight as any).inputSnapshotHash || null,
          status: insight.status
        }
      });
      results.push(saved);
    }

    await this.logAudit(user.id, 'RECALCULATE_AI_INSIGHTS', 'AIInsight', 'all', null, { 
      count: results.length,
      llmUsed,
      llmEnrichments: enrichmentCount,
      provider: llmUsed ? 'OpenAI' : 'Deterministic_Local'
    });
    
    return { success: true, generatedCount: results.length, enrichments: enrichmentCount };
  }



  async findAll(user: any, type?: string) {
    let whereClause: any = {};
    if (type) whereClause.insightType = type;

    // RBAC
    if (user.role.name === 'SalesRep') {
      // SalesRep should only see their own insights. For MVP, we filter strictly or skip complex joins.
      // We will rely on entity joins for SalesRep.
      const insights = await this.prisma.aIInsight.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' }
      });

      // Poor man's RBAC filter for MVP:
      const allowedCustomers = new Set((await this.prisma.customer.findMany({ where: { createdBy: user.id }, select: { id: true } })).map(c => c.id));
      const allowedLeads = new Set((await this.prisma.lead.findMany({ where: { assignedTo: user.id }, select: { id: true } })).map(l => l.id));

      return insights.filter(i => {
        if (i.entityType === 'Customer') return allowedCustomers.has(i.entityId);
        if (i.entityType === 'Lead') return allowedLeads.has(i.entityId);
        return false; // SalesRep doesn't see System/Manager alerts
      });
    }

    return this.prisma.aIInsight.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });
  }

  async findByGroup(user: any, group: string) {
    let types: string[] = [];
    if (group === 'leads') types = ['LeadScore'];
    else if (group === 'customers') types = ['ChurnRisk', 'CustomerHealth', 'NextBestProduct'];
    else if (group === 'manager') types = ['ManagerAlert'];

    const all = await this.findAll(user);
    return all.filter(i => types.includes(i.insightType));
  }

  async updateStatus(id: string, status: string, user: any) {
    const updated = await this.prisma.aIInsight.update({
      where: { id },
      data: { status, reviewedBy: user.id, reviewedAt: new Date() }
    });

    const action = status === 'Applied' ? 'APPLY_AI_INSIGHT' : 'DISMISS_AI_INSIGHT';
    await this.logAudit(user.id, action, 'AIInsight', id, null, { status });

    return updated;
  }

  private async logAudit(userId: string, action: string, entityType: string, entityId: string, oldValue: any, newValue: any) {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
        newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
      }
    });
  }
}
