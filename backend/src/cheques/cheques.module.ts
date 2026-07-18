import { Module } from '@nestjs/common';
import { ChequesService } from './cheques.service';
import { ChequesController } from './cheques.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MinioModule } from '../minio/minio.module';
import { FinancialModule } from '../financial/financial.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [PrismaModule, MinioModule, FinancialModule, InventoryModule],
  controllers: [ChequesController],
  providers: [ChequesService],
})
export class ChequesModule {}
