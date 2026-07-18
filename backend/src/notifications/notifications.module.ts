import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsProcessor } from './notifications.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { SmsProviderRegistryService } from './sms-provider-registry.service';

@Global()
@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'notifications',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
      },
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsProcessor,
    SmsProviderRegistryService
  ],
  exports: [NotificationsService]
})
export class NotificationsModule {}
