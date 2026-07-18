import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionUtil } from '../utils/encryption.util';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(createCustomerDto: CreateCustomerDto, userId: string) {
    const data = { ...createCustomerDto, createdBy: userId };

    if (data.nationalId) {
      data.nationalId = EncryptionUtil.encrypt(data.nationalId);
    }
    if (data.phone) {
      data.phone = EncryptionUtil.encrypt(data.phone);
    }

    const customer = await this.prisma.customer.create({
      data: data as any,
    });
    
    // Log creation
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE_CUSTOMER',
        entityType: 'Customer',
        entityId: customer.id,
      }
    });

    return this.decryptCustomerFields(customer, { revealSensitive: false });
  }

  async findAll() {
    const customers = await this.prisma.customer.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    
    return Promise.all(customers.map(c => this.decryptCustomerFields(c, { revealSensitive: false })));
  }

  async findOne(id: string, options?: { revealSensitive?: boolean; user?: any }) {
    const customer = await this.prisma.customer.findUnique({
      where: { id, deletedAt: null },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return this.decryptCustomerFields(customer, options);
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto, user: any) {
    const customer = await this.prisma.customer.findUnique({ where: { id, deletedAt: null } });
    if (!customer) throw new NotFoundException('Customer not found');

    if (user.role.name === 'SalesRep' && customer.createdBy !== user.id && customer.assignedUserId !== user.id) {
      throw new ForbiddenException('You do not have permission to modify this customer');
    }

    const data = { ...updateCustomerDto };
    if (data.nationalId) {
      data.nationalId = EncryptionUtil.encrypt(data.nationalId);
    }
    if (data.phone) {
      data.phone = EncryptionUtil.encrypt(data.phone);
    }

    const updated = await this.prisma.customer.update({
      where: { id },
      data: data as any,
    });

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_CUSTOMER',
        entityType: 'Customer',
        entityId: updated.id,
      }
    });

    return this.decryptCustomerFields(updated, { revealSensitive: false });
  }

  async remove(id: string, user: any, reason?: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id, deletedAt: null } });
    if (!customer) throw new NotFoundException('Customer not found');

    if (user.role.name === 'SalesRep' && customer.createdBy !== user.id && customer.assignedUserId !== user.id) {
      throw new ForbiddenException('You do not have permission to delete this customer');
    }

    await this.prisma.customer.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: user.id,
        deleteReason: reason || 'User requested deletion',
        status: 'Inactive',
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'SOFT_DELETE_CUSTOMER',
        entityType: 'Customer',
        entityId: id,
      }
    });

    return { message: 'Customer soft deleted successfully' };
  }

  private maskString(str: string | null | undefined, visibleStart: number, visibleEnd: number): string | null {
    if (!str) return null;
    if (str.length <= visibleStart + visibleEnd) return '***';
    const start = str.substring(0, visibleStart);
    const end = str.substring(str.length - visibleEnd);
    return `${start}****${end}`;
  }

  private async decryptCustomerFields(
    customer: any,
    options?: { revealSensitive?: boolean; user?: any }
  ) {
    let nationalId = customer.nationalId;
    let phone = customer.phone;

    if (nationalId) {
      try { nationalId = EncryptionUtil.decrypt(nationalId); } catch(e) {}
    }
    if (phone) {
      try { phone = EncryptionUtil.decrypt(phone); } catch(e) {}
    }

    const canReveal = options?.user?.role?.name && ['CEO', 'Finance'].includes(options.user.role.name);
    const shouldReveal = canReveal && options?.revealSensitive;

    if (shouldReveal) {
      await this.prisma.auditLog.create({
        data: {
          userId: options.user.id,
          action: 'VIEW_SENSITIVE_CUSTOMER_DATA',
          entityType: 'Customer',
          entityId: customer.id,
          ipAddress: 'System', // In real implementation, extract from request context
          newValue: { fieldsViewed: ['nationalId', 'phone'] } as any
        }
      });
      customer.nationalId = nationalId;
      customer.phone = phone;
    } else {
      customer.nationalId = this.maskString(nationalId, 3, 3);
      customer.phone = this.maskString(phone, 4, 3);
    }

    return customer;
  }
}
