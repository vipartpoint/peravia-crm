import { Injectable, Logger } from '@nestjs/common';
import { OpenAIProvider } from '../../ai-assistant/providers/openai.provider';

@Injectable()
export class AIExplanationAdapter {
  private readonly logger = new Logger(AIExplanationAdapter.name);

  constructor(private openaiProvider: OpenAIProvider) {}

  /**
   * Enriches a deterministic insight with an LLM-generated explanation if an API key is present.
   * Modifies the insightDescription in-place.
   */
  async enrichInsight(insight: any): Promise<void> {
    const apiKey = process.env.LLM_API_KEY;
    
    // Fallback: If no API key, keep the deterministic description as is.
    if (!apiKey) {
      this.logger.debug(`No AI_API_KEY. Using deterministic explanation for ${insight.insightTitle}`);
      return;
    }

    try {
      this.logger.log(`Enriching insight via LLM: ${insight.insightTitle}`);
      
      const safeDescription = this.redactPII(insight.insightDescription);
      const safeTitle = this.redactPII(insight.insightTitle);

      const prompt = `You are an expert CRM AI assistant.
I will provide you with a deterministically calculated insight about a customer or lead.
Your job is to rewrite the "Reasoning" and "Recommended Action" into a very persuasive, professional, and natural Persian (Farsi) paragraph. 
Do NOT change the Risk Score, Confidence Level, or the Contributing Factors. Just make the summary sound intelligent and insightful.

Original Insight Data:
Type: ${insight.insightType}
Title: ${safeTitle}
Score: ${insight.score}
Description:
${safeDescription}

Return EXACTLY the following structure with your improved Persian text inserted in the placeholders, maintaining Markdown:

**Score:** ${insight.score} (Risk/Status: ${insight.priority})
**Confidence:** (keep original confidence)

**Contributing Factors:**
(keep original factors exactly as they are)

**AI Reasoning:**
(Your persuasive, professional Persian paragraph explaining why this happened)

**Recommended Action:**
(Your intelligent, actionable advice in Persian)

*(Source: Hybrid AI - Deterministic + LLM Enriched)*`;

      const response = await this.openaiProvider.generateResponse([{ role: 'user', content: prompt }]);
      
      if (response && response.includes('**AI Reasoning:**')) {
        insight.insightDescription = response;
        insight.modelName = 'Hybrid_LLM_Enriched_v1';
      }
    } catch (e: any) {
      this.logger.error(`Failed to enrich insight: ${e.message}. Falling back to deterministic explanation.`);
    }
  }

  private redactPII(text: string): string {
    if (!text) return text;
    // Basic Redaction of Phone Numbers, National IDs, Emails, Bank accounts (16 digits)
    let safe = text.replace(/09\d{9}/g, '[REDACTED_PHONE]');
    safe = safe.replace(/\b\d{10}\b/g, '[REDACTED_NID]');
    safe = safe.replace(/\b\d{16}\b/g, '[REDACTED_CARD]');
    safe = safe.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');
    return safe;
  }
}
