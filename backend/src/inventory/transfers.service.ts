import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from './inventory.service';

@Injectable()
export class TransfersService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService
  ) {}

  async create(data: any, userId: string) {
    if (data.sourceWarehouseId === data.destWarehouseId) {
      throw new BadRequestException('Source and destination warehouses must be different');
    }

    const request = await this.prisma.stockTransferRequest.create({
      data: {
        sourceWarehouseId: data.sourceWarehouseId,
        destWarehouseId: data.destWarehouseId,
        productId: data.productId,
        quantity: data.quantity,
        notes: data.notes,
        status: 'Draft',
        createdBy: userId
      }
    });

    await this.prisma.auditLog.create({
      data: { userId, action: 'CREATE_TRANSFER_REQUEST', entityType: 'StockTransferRequest', entityId: request.id }
    });

    return request;
  }

  async findAll(status?: string) {
    return this.prisma.stockTransferRequest.findMany({
      where: status ? { status } : undefined,
      include: {
        sourceWarehouse: { select: { name: true, code: true } },
        destWarehouse: { select: { name: true, code: true } },
        product: { select: { name: true, sku: true } },
        creator: { select: { username: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async submitForApproval(id: string, userId: string) {
    const request = await this.prisma.stockTransferRequest.findUnique({ where: { id } });
    if (!request || request.status !== 'Draft') throw new BadRequestException('Invalid request');

    const updated = await this.prisma.stockTransferRequest.update({
      where: { id },
      data: { status: 'PendingApproval' }
    });

    await this.prisma.approvalRequest.create({
      data: {
        requestType: 'WarehouseTransfer',
        entityType: 'WarehouseTransfer',
        entityId: id,
        requestedBy: userId,
        title: `درخواست انتقال موجودی از انبار ${request.sourceWarehouseId} به ${request.destWarehouseId}`,
        priority: 'Medium',
        reason: request.notes,
      }
    });

    await this.prisma.auditLog.create({
      data: { userId, action: 'SUBMIT_TRANSFER_REQUEST', entityType: 'StockTransferRequest', entityId: id }
    });

    return updated;
  }

  async approve(id: string, userId: string) {
    const request = await this.prisma.stockTransferRequest.findUnique({ where: { id } });
    if (!request || request.status !== 'PendingApproval') throw new BadRequestException('Invalid request');

    const updated = await this.prisma.stockTransferRequest.update({
      where: { id },
      data: { status: 'Approved' }
    });

    await this.prisma.auditLog.create({
      data: { userId, action: 'APPROVE_TRANSFER_REQUEST', entityType: 'StockTransferRequest', entityId: id }
    });

    return updated;
  }

  async complete(id: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.stockTransferRequest.findUnique({ where: { id } });
      if (!request || request.status !== 'Approved') throw new BadRequestException('Invalid request');

      // Atomic transfer
      await this.inventoryService.transferStockTx(
        tx,
        request.sourceWarehouseId,
        request.destWarehouseId,
        request.productId,
        Number(request.quantity),
        request.id,
        userId
      );

      const updated = await tx.stockTransferRequest.update({
        where: { id },
        data: { status: 'Completed' }
      });

      await tx.auditLog.create({
        data: { userId, action: 'COMPLETE_TRANSFER_REQUEST', entityType: 'StockTransferRequest', entityId: id }
      });

      return updated;
    });
  }

  async reject(id: string, notes: string, userId: string) {
    const request = await this.prisma.stockTransferRequest.findUnique({ where: { id } });
    if (!request || !['PendingApproval', 'Draft'].includes(request.status)) throw new BadRequestException('Invalid request');

    const updated = await this.prisma.stockTransferRequest.update({
      where: { id },
      data: { status: 'Rejected', notes: notes ? `${request.notes || ''}\nRejection Reason: ${notes}` : request.notes }
    });

    await this.prisma.auditLog.create({
      data: { userId, action: 'REJECT_TRANSFER_REQUEST', entityType: 'StockTransferRequest', entityId: id }
    });

    return updated;
  }
}
