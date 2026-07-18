import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePresentationDto } from './dto/create-presentation.dto';
import { UpdatePresentationDto } from './dto/update-presentation.dto';

@Injectable()
export class PresentationsService {
  constructor(private prisma: PrismaService) {}

  async create(createPresentationDto: CreatePresentationDto, user: any) {
    if (!createPresentationDto.leadId && !createPresentationDto.customerId) {
      throw new BadRequestException('At least one of leadId or customerId is required.');
    }
    if (createPresentationDto.leadId && createPresentationDto.customerId) {
      throw new BadRequestException('Cannot provide both leadId and customerId in MVP.');
    }

    const { nextFollowUpAt, rejectionReasons, ...data } = createPresentationDto;

    const presentation = await this.prisma.presentation.create({
      data: {
        ...data,
        rejectionReasons: rejectionReasons ? JSON.stringify(rejectionReasons) : undefined,
        nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt) : null,
        userId: user.id
      }
    });

    await this.logAudit(user.id, 'CREATE_PRESENTATION', 'Presentation', presentation.id, null, presentation);
    return presentation;
  }

  async findAll(user: any) {
    let whereClause: any = { deletedAt: null };

    if (user.role.name === 'SalesRep') {
      whereClause.userId = user.id;
    }

    const presentations = await this.prisma.presentation.findMany({
      where: whereClause,
      include: {
        lead: { select: { name: true } },
        customer: { select: { name: true } },
        user: { select: { username: true } },
        product: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return presentations.map(p => ({
      ...p,
      rejectionReasons: p.rejectionReasons ? JSON.parse(p.rejectionReasons as string) : []
    }));
  }

  async findOne(id: string) {
    const presentation = await this.prisma.presentation.findUnique({
      where: { id },
      include: {
        lead: true,
        customer: true,
        user: { select: { username: true } },
        product: true
      }
    });
    if (!presentation || presentation.deletedAt) throw new NotFoundException('Presentation not found');
    
    return {
      ...presentation,
      rejectionReasons: presentation.rejectionReasons ? JSON.parse(presentation.rejectionReasons as string) : []
    };
  }

  async update(id: string, updatePresentationDto: UpdatePresentationDto, user: any) {
    const existing = await this.prisma.presentation.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Presentation not found');

    const { nextFollowUpAt, rejectionReasons, ...data } = updatePresentationDto;

    const dataToUpdate: any = { ...data };
    if (nextFollowUpAt) dataToUpdate.nextFollowUpAt = new Date(nextFollowUpAt);
    if (rejectionReasons) dataToUpdate.rejectionReasons = JSON.stringify(rejectionReasons);

    const updated = await this.prisma.presentation.update({
      where: { id },
      data: dataToUpdate
    });

    await this.logAudit(user.id, 'UPDATE_PRESENTATION', 'Presentation', id, existing, updated);
    return updated;
  }

  async remove(id: string, user: any) {
    const archived = await this.prisma.presentation.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: user.id }
    });
    await this.logAudit(user.id, 'ARCHIVE_PRESENTATION', 'Presentation', id, null, null);
    return archived;
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
