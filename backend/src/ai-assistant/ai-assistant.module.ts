import { Module } from '@nestjs/common';
import { AiAssistantService } from './ai-assistant.service';
import { AiAssistantController } from './ai-assistant.controller';
import { ContextBuilderService } from './services/context-builder.service';
import { PromptBuilderService } from './services/prompt-builder.service';
import { QueryExecutionService } from './services/query-execution.service';
import { AISecurityService } from './services/ai-security.service';
import { OpenAIProvider } from './providers/openai.provider';
import { LocalLLMProvider } from './providers/local.provider';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AiAssistantController],
  providers: [
    AiAssistantService,
    ContextBuilderService,
    PromptBuilderService,
    QueryExecutionService,
    AISecurityService,
    OpenAIProvider,
    LocalLLMProvider
  ],
})
export class AiAssistantModule {}
