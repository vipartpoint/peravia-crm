import { Module } from '@nestjs/common';
import { AiInsightsService } from './ai-insights.service';
import { AiInsightsController } from './ai-insights.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { LeadScoreEngine } from './engines/lead-score.engine';
import { ChurnRiskEngine } from './engines/churn-risk.engine';
import { CustomerHealthEngine } from './engines/customer-health.engine';
import { OpportunityDetectionEngine } from './engines/opportunity-detection.engine';
import { ManagerAlertsEngine } from './engines/manager-alerts.engine';
import { AIExplanationAdapter } from './engines/ai-explanation.adapter';
import { OpenAIProvider } from '../ai-assistant/providers/openai.provider';

@Module({
  imports: [PrismaModule],
  controllers: [AiInsightsController],
  providers: [
    AiInsightsService,
    LeadScoreEngine,
    ChurnRiskEngine,
    CustomerHealthEngine,
    OpportunityDetectionEngine,
    ManagerAlertsEngine,
    AIExplanationAdapter,
    OpenAIProvider
  ],
})
export class AiInsightsModule {}
