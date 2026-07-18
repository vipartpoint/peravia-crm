import { Module } from '@nestjs/common';
import { CatalogsController } from './catalogs.controller';
import { CatalogsService } from './catalogs.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [PrismaModule, AuthModule, ActivitiesModule],
  controllers: [CatalogsController],
  providers: [CatalogsService],
})
export class CatalogsModule {}
