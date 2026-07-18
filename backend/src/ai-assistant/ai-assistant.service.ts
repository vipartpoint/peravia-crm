import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LLMProvider } from './providers/llm-provider.interface';
import { OpenAIProvider } from './providers/openai.provider';
import { LocalLLMProvider } from './providers/local.provider';
import { ContextBuilderService } from './services/context-builder.service';
import { PromptBuilderService } from './services/prompt-builder.service';
import { QueryExecutionService } from './services/query-execution.service';
import { AISecurityService } from './services/ai-security.service';

@Injectable()
export class AiAssistantService {
  private llmProvider: LLMProvider;

  constructor(
    private prisma: PrismaService,
    private contextBuilder: ContextBuilderService,
    private promptBuilder: PromptBuilderService,
    private queryExecution: QueryExecutionService,
    private aiSecurity: AISecurityService,
    private openaiProvider: OpenAIProvider,
    private localProvider: LocalLLMProvider
  ) {
    const providerName = process.env.LLM_PROVIDER || 'openai';
    if (providerName === 'local') {
      this.llmProvider = this.localProvider;
    } else {
      this.llmProvider = this.openaiProvider;
    }
  }

  async getSessions(userId: string) {
    return this.prisma.aIChatSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getMessages(sessionId: string, userId: string) {
    const session = await this.prisma.aIChatSession.findFirst({ where: { id: sessionId, userId } });
    if (!session) throw new Error('Session not found');

    return this.prisma.aIChatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' }
    });
  }

  async processQuery(userId: string, query: string, sessionId?: string, reqIp?: string) {
    // 0. Sanitize input to prevent Prompt Injection
    this.aiSecurity.sanitizeInput(query);

    // Audit Query
    await this.prisma.auditLog.create({
      data: { userId, action: 'AI_QUERY', entityType: 'Query', entityId: 'N/A', ipAddress: reqIp || 'System' }
    });

    // 1. Session Management
    let session;
    if (sessionId) {
      session = await this.prisma.aIChatSession.findFirst({ where: { id: sessionId, userId } });
    }
    if (!session) {
      session = await this.prisma.aIChatSession.create({
        data: { userId, title: query.substring(0, 30) + '...' }
      });
      await this.prisma.auditLog.create({
        data: { userId, action: 'AI_SESSION_CREATED', entityType: 'AIChatSession', entityId: session.id, ipAddress: reqIp || 'System' }
      });
    }

    // Save User Message
    await this.prisma.aIChatMessage.create({
      data: { sessionId: session.id, role: 'user', content: query }
    });

    // 2. Build Context
    const intent = this.queryExecution.detectIntent(query);
    const contextStr = await this.contextBuilder.buildContext(intent);
    const systemPrompt = this.promptBuilder.buildSystemPrompt(contextStr);

    // 3. Fetch History
    const history = await this.prisma.aIChatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'asc' }
    });

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((m: any) => ({ role: m.role, content: m.content }))
    ];

    // 4. Generate Response
    let responseText = await this.llmProvider.generateResponse(messages);
    
    // 4.1 Filter Output
    responseText = this.aiSecurity.filterOutput(responseText);

    // 5. Save Assistant Message
    await this.prisma.aIChatMessage.create({
      data: { sessionId: session.id, role: 'assistant', content: responseText }
    });

    // Audit Response
    await this.prisma.auditLog.create({
      data: { userId, action: 'AI_RESPONSE', entityType: 'Response', entityId: session.id, ipAddress: reqIp || 'System' }
    });

    return { sessionId: session.id, response: responseText };
  }
}
