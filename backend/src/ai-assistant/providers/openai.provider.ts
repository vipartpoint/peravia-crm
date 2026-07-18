import { Injectable, Logger } from '@nestjs/common';
import { LLMProvider } from './llm-provider.interface';

@Injectable()
export class OpenAIProvider implements LLMProvider {
  name = 'OpenAI';
  private logger = new Logger(OpenAIProvider.name);

  async generateResponse(messages: { role: string; content: string }[]): Promise<string> {
    const apiKey = process.env.LLM_API_KEY;
    const model = process.env.LLM_MODEL || 'gpt-4o';
    const baseUrl = process.env.LLM_BASE_URL || 'https://api.openai.com/v1/chat/completions';

    if (!apiKey) {
      this.logger.warn('LLM_API_KEY is not set. Returning mock response.');
      return 'این یک پاسخ آزمایشی است، زیرا کلید API تنظیم نشده است.';
    }

    try {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (e: any) {
      this.logger.error('Error calling OpenAI API:', e.message);
      throw new Error('LLM Provider Error');
    }
  }
}
