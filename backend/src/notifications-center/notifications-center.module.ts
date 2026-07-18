import { Module, Global } from '@nestjs/common';
import { NotificationsCenterService } from './notifications-center.service';
import { NotificationsCenterController } from './notifications-center.controller';

@Global()
@Module({
  controllers: [NotificationsCenterController],
  providers: [NotificationsCenterService],
  exports: [NotificationsCenterService]
})
export class NotificationsCenterModule {}
