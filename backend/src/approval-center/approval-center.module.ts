import { Module } from '@nestjs/common';
import { ApprovalCenterService } from './approval-center.service';
import { ApprovalCenterController } from './approval-center.controller';
import { NotificationsCenterModule } from '../notifications-center/notifications-center.module';
import { ActivitiesModule } from '../activities/activities.module';
import { InventoryModule } from '../inventory/inventory.module';
import { WarehousesModule } from '../warehouses/warehouses.module';

@Module({
  imports: [
    NotificationsCenterModule,
    ActivitiesModule,
    // Add forwardRef if needed later, but we prefer importing modules without circular dependency
    // We will use Prisma for direct updates where domain logic isn't heavily coupled,
    // or inject existing services if needed. We'll start simple.
  ],
  controllers: [ApprovalCenterController],
  providers: [ApprovalCenterService],
  exports: [ApprovalCenterService],
})
export class ApprovalCenterModule {}
