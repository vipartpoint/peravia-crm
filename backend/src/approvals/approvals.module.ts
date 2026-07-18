import { Module, forwardRef } from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { ApprovalsController } from './approvals.controller';
import { ApprovalRulesEngine } from './approval-rules.engine';
import { PrismaModule } from '../prisma/prisma.module';
import { OrdersModule } from '../orders/orders.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule, 
    NotificationsModule,
    forwardRef(() => OrdersModule)
  ],
  controllers: [ApprovalsController],
  providers: [ApprovalsService, ApprovalRulesEngine],
  exports: [ApprovalsService, ApprovalRulesEngine],
})
export class ApprovalsModule {}
