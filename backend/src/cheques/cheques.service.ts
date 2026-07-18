import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionUtil } from '../utils/encryption.util';
import { MinioService } from '../minio/minio.service';
import { FinancialCalculationService } from '../financial/financial-calculation.service';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class ChequesService {
  constructor(
    private prisma: PrismaService,
    private minioService: MinioService,
    private financialCalc: FinancialCalculationService,
    private inventoryService: InventoryService
  ) {}

  async create(data: any, file: Express.Multer.File, user: any) {
    if (data.orderId) {
      const shortages = await this.prisma.inventoryShortageRequest.count({
        where: { orderId: data.orderId, status: { in: ['PendingWarehouseManager', 'PendingProductionManager'] } }
      });
      if (shortages > 0) {
        throw new BadRequestException('Cannot collect cheque while feasibility review (shortage request) is pending.');
      }
    }

    let imageUrl = null;
    if (file) {
      const fileName = `cheque-${Date.now()}-${file.originalname}`;
      imageUrl = await this.minioService.uploadFile(file, fileName);
    }

    const encryptedNumber = EncryptionUtil.encrypt(data.chequeNumber);

    const cheque = await this.prisma.cheque.create({
      data: {
        customerId: data.customerId,
        orderId: data.orderId || null,
        chequeNumber: encryptedNumber,
        bankName: data.bankName,
        branchName: data.branchName,
        ownerName: data.ownerName,
        amount: data.amount,
        dueDate: new Date(data.dueDate),
        receivedDate: data.receivedDate ? new Date(data.receivedDate) : new Date(),
        status: data.status || 'Registered',
        imageUrl: imageUrl,
        notes: data.notes,
        createdBy: user.id,
      },
    });

    await this.logAudit(user.id, 'CREATE_CHEQUE', cheque.id, null, cheque);
    return cheque;
  }

  async findAll(user: any, filter?: string) {
    const whereClause: any = { deletedAt: null };

    if (user.role.name === 'SalesRep') {
      const allowedCustomers = await this.prisma.customer.findMany({
        where: { createdBy: user.id },
        select: { id: true }
      });
      whereClause.customerId = { in: allowedCustomers.map(c => c.id) };
    }

    const now = new Date();
    const next7Days = new Date(now.getTime() + 7 * 24 * 3600 * 1000);

    if (filter === 'due-soon') {
      whereClause.status = { in: ['Registered', 'NearDue'] };
      whereClause.dueDate = { lte: next7Days, gte: now };
    } else if (filter === 'overdue') {
      whereClause.status = { notIn: ['Cleared', 'Bounced', 'Cancelled'] };
      whereClause.dueDate = { lt: now };
    } else if (filter === 'bounced') {
      whereClause.status = 'Bounced';
    }

    const cheques = await this.prisma.cheque.findMany({
      where: whereClause,
      include: { customer: true, order: true },
      orderBy: { dueDate: 'desc' }
    });

    return cheques.map(c => {
      // Mask cheque number for lists
      const decrypted = EncryptionUtil.decrypt(c.chequeNumber);
      const masked = decrypted ? `****${decrypted.slice(-4)}` : '****';
      return {
        ...c,
        chequeNumber: masked,
        // SystemAdmin doesn't even see the masked? They see masked.
        // Image URL is never returned in list.
        imageUrl: undefined
      };
    });
  }

  async findOne(id: string, user: any) {
    const cheque = await this.prisma.cheque.findUnique({
      where: { id },
      include: { customer: true, order: true }
    });

    if (!cheque || cheque.deletedAt) throw new NotFoundException();

    // Permissions
    if (user.role.name === 'SalesRep' && cheque.customer.createdBy !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    let returnedCheque = { ...cheque } as any;

    // Full reveal for authorized roles
    if (['CEO', 'Finance'].includes(user.role.name)) {
      returnedCheque.chequeNumber = EncryptionUtil.decrypt(cheque.chequeNumber);
      await this.logAudit(user.id, 'VIEW_CHEQUE_SENSITIVE_DATA', cheque.id, null, null);
    } else {
      const decrypted = EncryptionUtil.decrypt(cheque.chequeNumber);
      returnedCheque.chequeNumber = decrypted ? `****${decrypted.slice(-4)}` : '****';
    }

    return returnedCheque;
  }

  async getChequeImage(id: string, user: any) {
    const cheque = await this.prisma.cheque.findUnique({ where: { id }, include: { customer: true } });
    if (!cheque || !cheque.imageUrl) throw new NotFoundException('Image not found');

    if (user.role.name === 'SalesRep' && cheque.customer.createdBy !== user.id) {
      throw new ForbiddenException('Access denied');
    }
    if (user.role.name === 'SystemAdmin' || user.role.name === 'SalesManager') {
      throw new ForbiddenException('Role not allowed to view cheque image');
    }

    await this.logAudit(user.id, 'VIEW_CHEQUE_IMAGE', cheque.id, null, null);

    const presignedUrl = await this.minioService.getPresignedUrl(cheque.imageUrl);
    return { url: presignedUrl };
  }

  async updateStatus(id: string, status: string, user: any) {
    const cheque = await this.prisma.cheque.findUnique({ where: { id } });
    if (!cheque) throw new NotFoundException();

    let clearedAt = cheque.clearedAt;
    let bouncedAt = cheque.bouncedAt;

    if (status === 'Cleared') clearedAt = new Date();
    if (status === 'Bounced') bouncedAt = new Date();

    const updated = await this.prisma.cheque.update({
      where: { id },
      data: { status, clearedAt, bouncedAt }
    });

    await this.logAudit(user.id, 'CHANGE_CHEQUE_STATUS', id, cheque.status, status);

    // Recalculate order payment status if linked to an order
    // Do this if status goes to Cleared OR moves away from Cleared
    if (cheque.orderId && (status === 'Cleared' || cheque.status === 'Cleared')) {
      await this.financialCalc.recalculateOrderPaymentStatus(cheque.orderId);
      if (status === 'Cleared') {
        await this.inventoryService.deductRealStockAfterPayment(cheque.orderId, user.id);
      }
    }

    return updated;
  }

  private async logAudit(userId: string, action: string, entityId: string, oldValue: any, newValue: any) {
    await this.prisma.auditLog.create({
      data: {
        userId, action, entityType: 'Cheque', entityId,
        oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
        newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
      }
    });
  }
}
