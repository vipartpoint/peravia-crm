import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { FinancialModule } from '../financial/financial.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [PrismaModule, FinancialModule, InventoryModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
