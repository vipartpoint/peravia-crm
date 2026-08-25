import { Module } from '@nestjs/common';
import { StockCertificatesService } from './stock-certificates.service';
import { StockCertificatesController } from './stock-certificates.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StockCertificatesController],
  providers: [StockCertificatesService],
  exports: [StockCertificatesService],
})
export class StockCertificatesModule {}
