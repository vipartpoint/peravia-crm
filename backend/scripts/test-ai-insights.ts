import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AiInsightsService } from '../src/ai-insights/ai-insights.service';
import { PrismaService } from '../src/prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const aiService = app.get(AiInsightsService);

  const prisma = app.get(PrismaService);
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log('No user found in DB to run test with.');
    await app.close();
    return;
  }

  console.log('--- 1. FIRST RUN (No Cache) ---');
  const result1 = await aiService.recalculate({ id: user.id, role: { name: 'SystemAdmin' } });
  console.log('Generated:', result1);

  console.log('\n--- 2. SECOND RUN (Caching Verification) ---');
  const result2 = await aiService.recalculate({ id: user.id, role: { name: 'SystemAdmin' } });
  console.log('Generated:', result2);
  
  const insights = await aiService.findAll({ id: user.id, role: { name: 'SystemAdmin' } });
  console.log('\n--- SAMPLE INSIGHTS ---');
  for (const i of insights.slice(0, 5)) {
    console.log(`\n[${i.insightType}] ${i.insightTitle} (Score: ${i.score})`);
    console.log(i.insightDescription);
    console.log('---');
  }

  await app.close();
}

bootstrap();
