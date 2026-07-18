import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePriceListDto } from './dto/create-price-list.dto';
import { UpdatePriceListDto } from './dto/update-price-list.dto';

@Injectable()
export class PriceListsService {
  constructor(private prisma: PrismaService) {}

  async create(createPriceListDto: CreatePriceListDto, userId: string) {
    const { items, ...priceListData } = createPriceListDto;

    const priceList = await this.prisma.priceList.create({
      data: {
        ...priceListData,
        startDate: new Date(priceListData.startDate),
        endDate: priceListData.endDate ? new Date(priceListData.endDate) : null,
        createdBy: userId,
        items: {
          create: items.map(item => ({
            productId: item.productId,
            price: item.price,
            discountPercent: item.discountPercent || 0,
            finalPrice: item.finalPrice
          }))
        }
      },
      include: {
        items: true
      }
    });

    await this.logAudit(userId, 'CREATE_PRICE_LIST', 'PriceList', priceList.id, null, priceList);
    return priceList;
  }

  async findAll() {
    return this.prisma.priceList.findMany({
      include: {
        _count: { select: { items: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string) {
    const priceList = await this.prisma.priceList.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, brand: true }
            }
          }
        }
      }
    });
    if (!priceList) throw new NotFoundException(`PriceList ${id} not found`);
    return priceList;
  }

  async update(id: string, updatePriceListDto: UpdatePriceListDto, userId: string) {
    const { items, ...priceListData } = updatePriceListDto;
    const existing = await this.findOne(id);

    // Simplest way to update items is delete old and insert new, or just update the header
    const updateData: any = {
      ...priceListData,
    };
    if (priceListData.startDate) updateData.startDate = new Date(priceListData.startDate);
    if (priceListData.endDate) updateData.endDate = new Date(priceListData.endDate);

    const priceList = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.priceList.update({
        where: { id },
        data: updateData
      });

      if (items) {
        await tx.priceListItem.deleteMany({ where: { priceListId: id } });
        await tx.priceListItem.createMany({
          data: items.map(item => ({
            priceListId: id,
            productId: item.productId,
            price: item.price,
            discountPercent: item.discountPercent || 0,
            finalPrice: item.finalPrice
          }))
        });
      }

      return tx.priceList.findUnique({ where: { id }, include: { items: true } });
    });

    await this.logAudit(userId, 'UPDATE_PRICE_LIST', 'PriceList', id, existing, priceList);
    return priceList;
  }

  async remove(id: string, userId: string) {
    const existing = await this.findOne(id);
    const deleted = await this.prisma.priceList.delete({
      where: { id }
    });
    await this.logAudit(userId, 'DELETE_PRICE_LIST', 'PriceList', id, existing, null);
    return deleted;
  }

  private async logAudit(userId: string, action: string, entityType: string, entityId: string, oldValue: any, newValue: any) {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
        newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
      }
    });
  }
}
