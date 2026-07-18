import { Module, forwardRef } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ReceivablesModule } from '../receivables/receivables.module';
import { ApprovalsModule } from '../approvals/approvals.module';
import { InventoryModule } from '../inventory/inventory.module';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [
    PrismaModule, 
    ReceivablesModule, 
    InventoryModule,
    ActivitiesModule,
    forwardRef(() => ApprovalsModule)
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService]
})
export class OrdersModule {}
