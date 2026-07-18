import { Module } from '@nestjs/common';
import { TerritoriesService } from './territories.service';
import { TerritoriesController } from './territories.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TerritoriesController],
  providers: [TerritoriesService],
})
export class TerritoriesModule {}
