export interface LLMProvider {
  name: string;
  generateResponse(messages: { role: string; content: string }[]): Promise<string>;
}
