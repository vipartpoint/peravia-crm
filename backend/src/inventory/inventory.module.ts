import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { ShortageRequestsController } from './shortage-requests.controller';
import { InventoryReportsController } from './inventory-reports.controller';
import { InventoryReportsService } from './inventory-reports.service';
import { TransfersService } from './transfers.service';
import { TransfersController } from './transfers.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [PrismaModule, PermissionsModule],
  controllers: [InventoryController, ShortageRequestsController, InventoryReportsController, TransfersController],
  providers: [InventoryService, InventoryReportsService, TransfersService],
  exports: [InventoryService]
})
export class InventoryModule {}
