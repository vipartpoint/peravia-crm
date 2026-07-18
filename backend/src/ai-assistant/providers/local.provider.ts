import { Injectable } from '@nestjs/common';
import { LLMProvider } from './llm-provider.interface';

@Injectable()
export class LocalLLMProvider implements LLMProvider {
  name = 'LocalLLM';

  async generateResponse(messages: { role: string; content: string }[]): Promise<string> {
    const baseUrl = process.env.LLM_BASE_URL || 'http://localhost:11434/api/chat';
    const model = process.env.LLM_MODEL || 'llama3';

    try {
      // Example for Ollama format
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Local LLM error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.message.content;
    } catch (e: any) {
      console.error(e);
      throw new Error('Local LLM Error');
    }
  }
}
