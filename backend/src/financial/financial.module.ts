import { Module } from '@nestjs/common';
import { FinancialCalculationService } from './financial-calculation.service';
import { FinancialAlertsService } from './financial-alerts.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ReceivablesModule } from '../receivables/receivables.module';

@Module({
  imports: [PrismaModule, NotificationsModule, ReceivablesModule],
  providers: [FinancialCalculationService, FinancialAlertsService],
  exports: [FinancialCalculationService, FinancialAlertsService],
})
export class FinancialModule {}
