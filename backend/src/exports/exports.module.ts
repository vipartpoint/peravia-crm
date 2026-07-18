import { Module, Global } from '@nestjs/common';
import { ExportsService } from './exports.service';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [ExportsService],
  exports: [ExportsService]
})
export class ExportsModule {}
