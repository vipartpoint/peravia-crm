import { Controller, Get, Post, Param, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('shortage-requests')
export class ShortageRequestsController {
  constructor(private readonly prisma: PrismaService) {}

  @Roles('SystemAdmin', 'CEO', 'WarehouseManager', 'ProductionManager')
  @Get()
  async getShortageRequests() {
    return this.prisma.inventoryShortageRequest.findMany({
      include: {
        order: { select: { orderNumber: true } },
        product: { select: { name: true, sku: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  @Roles('SystemAdmin', 'WarehouseManager')
  @Post(':id/warehouse-approve')
  async warehouseApprove(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any;
    const request = await this.prisma.inventoryShortageRequest.findUnique({ where: { id } });
    if (!request || request.status !== 'PendingWarehouseManager') {
      throw new BadRequestException('Invalid request or status');
    }

    const updated = await this.prisma.inventoryShortageRequest.update({
      where: { id },
      data: { status: 'PendingProductionManager' }
    });

    await this.prisma.auditLog.create({
      data: { userId: user.id, action: 'SHORTAGE_REQUEST_WH_APPROVE', entityType: 'InventoryShortageRequest', entityId: id }
    });

    return updated;
  }

  @Roles('SystemAdmin', 'ProductionManager')
  @Post(':id/production-approve')
  async productionApprove(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any;
    const request = await this.prisma.inventoryShortageRequest.findUnique({ where: { id } });
    if (!request || request.status !== 'PendingProductionManager') {
      throw new BadRequestException('Invalid request or status');
    }

    const updated = await this.prisma.inventoryShortageRequest.update({
      where: { id },
      data: { status: 'Approved' }
    });

    await this.prisma.auditLog.create({
      data: { userId: user.id, action: 'SHORTAGE_REQUEST_PROD_APPROVE', entityType: 'InventoryShortageRequest', entityId: id }
    });

    return updated;
  }

  @Roles('SystemAdmin', 'WarehouseManager', 'ProductionManager')
  @Post(':id/reject')
  async reject(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any;
    const request = await this.prisma.inventoryShortageRequest.findUnique({ where: { id } });
    if (!request || ['Approved', 'Rejected'].includes(request.status)) {
      throw new BadRequestException('Invalid request or status');
    }

    const updated = await this.prisma.inventoryShortageRequest.update({
      where: { id },
      data: { status: 'Rejected' }
    });

    await this.prisma.auditLog.create({
      data: { userId: user.id, action: 'SHORTAGE_REQUEST_REJECT', entityType: 'InventoryShortageRequest', entityId: id }
    });

    return updated;
  }
}
