import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
const PDFDocument = require('pdfkit');

@Injectable()
export class CustomerPortalService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  private normalizePhone(phone: string): string {
    let p = phone.trim();
    if (p.startsWith('+98')) p = '0' + p.slice(3);
    if (p.startsWith('0098')) p = '0' + p.slice(4);
    if (p.startsWith('98') && p.length === 12) p = '0' + p.slice(2);
    if (p.length === 10 && p.startsWith('9')) p = '0' + p;
    return p;
  }

  async verifyAndGenerateToken(orderNumber: string, mobile: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: {
        customer: {
          include: { contacts: true }
        }
      }
    });

    if (!order) {
      await this.prisma.auditLog.create({
        data: {
          action: 'PORTAL_LOOKUP_FAILED',
          entityType: 'Order',
          entityId: orderNumber,
          userId: null,
          newValue: { reason: 'Order not found', attemptedMobile: mobile }
        }
      });
      throw new UnauthorizedException('اطلاعات واردشده معتبر نیست.');
    }

    const normalizedInput = this.normalizePhone(mobile);
    const primaryPhone = order.customer.phone ? this.normalizePhone(order.customer.phone) : null;
    const contactPhones = order.customer.contacts.map(c => c.phone ? this.normalizePhone(c.phone) : null).filter(Boolean);

    if (normalizedInput !== primaryPhone && !contactPhones.includes(normalizedInput)) {
      await this.prisma.auditLog.create({
        data: {
          action: 'PORTAL_LOOKUP_FAILED',
          entityType: 'Order',
          entityId: orderNumber,
          userId: null,
          newValue: { reason: 'Mobile mismatch', attemptedMobile: mobile }
        }
      });
      throw new UnauthorizedException('اطلاعات واردشده معتبر نیست.');
    }

    const payload = {
      orderId: order.id,
      customerId: order.customerId,
      purpose: 'customer_portal_tracking'
    };

    const trackingToken = await this.jwtService.signAsync(payload);

    await this.prisma.auditLog.create({
      data: {
        action: 'PORTAL_TOKEN_GENERATED',
        entityType: 'Order',
        entityId: order.id,
        userId: null,
        newValue: { customerId: order.customerId, maskedMobile: mobile.slice(0, 4) + '***' + mobile.slice(-3) }
      }
    });

    return { trackingToken };
  }

  private mapStatusToPublic(status: string): string {
    const statusMap: Record<string, string> = {
      'Draft': 'در حال بررسی',
      'PendingApproval': 'در حال بررسی',
      'Approved': 'تایید شده',
      'Delivered': 'ارسال شده',
      'Completed': 'تحویل شده',
      'Rejected': 'لغو شده',
      'Cancelled': 'لغو شده',
      'Returned': 'مرجوع شده'
    };
    return statusMap[status] || 'در حال بررسی';
  }

  async getOrderSummary(orderId: string, customerId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order || order.customerId !== customerId) {
      throw new UnauthorizedException('اطلاعات واردشده معتبر نیست.');
    }

    const publicStatus = this.mapStatusToPublic(order.status);

    return {
      orderNumber: order.orderNumber,
      publicStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      deliveryStatus: order.deliveredAt ? 'تحویل شده' : 'در انتظار',
      totalAmount: order.totalAmount,
      paidAmount: order.collectedAmount,
      remainingAmount: order.uncollectedAmount
    };
  }

  async getOrderStatusTimeline(orderId: string, customerId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.customerId !== customerId) throw new UnauthorizedException('اطلاعات واردشده معتبر نیست.');

    const timeline = [
      { step: 'Order Registered', label: 'ثبت سفارش', date: order.createdAt, completed: true }
    ];

    if (['Approved', 'Delivered', 'Completed'].includes(order.status)) {
      timeline.push({ step: 'Financial Approval', label: 'تایید مالی', date: order.updatedAt, completed: true });
    }

    if (['Delivered', 'Completed'].includes(order.status)) {
      timeline.push({ step: 'Dispatched', label: 'ارسال شده', date: order.deliveredAt || order.updatedAt, completed: true });
    }
    
    if (order.status === 'Completed') {
      timeline.push({ step: 'Delivered', label: 'تحویل شده', date: order.deliveredAt || order.updatedAt, completed: true });
    }

    return { timeline, currentStatus: this.mapStatusToPublic(order.status) };
  }

  async getOrderItems(orderId: string, customerId: string) {
    const items = await this.prisma.orderItem.findMany({
      where: { orderId },
      include: { product: true }
    });

    return items.map(i => ({
      productName: i.product.name,
      quantity: i.quantity,
      unit: 'عدد'
    }));
  }

  async getCustomerFinancials(customerId: string) {
    const orders = await this.prisma.order.findMany({ where: { customerId } });
    const cheques = await this.prisma.cheque.findMany({ where: { customerId } });

    let totalAmount = 0;
    let paidAmount = 0;
    let remainingAmount = 0;
    
    orders.forEach(o => {
      if (['Approved', 'Delivered', 'Completed'].includes(o.status)) {
        totalAmount += Number(o.totalAmount);
        paidAmount += Number(o.collectedAmount);
        remainingAmount += Number(o.uncollectedAmount);
      }
    });

    let pendingChequeAmount = 0;
    let clearedChequeAmount = 0;
    cheques.forEach(c => {
      if (c.status === 'Pending') pendingChequeAmount += Number(c.amount);
      if (c.status === 'Cleared') clearedChequeAmount += Number(c.amount);
    });

    return {
      totalAmount,
      paidAmount,
      remainingAmount,
      pendingChequeAmount,
      clearedChequeAmount,
      paymentStatus: remainingAmount > 0 ? 'مبلغ باقیمانده دارد' : 'تسویه شده'
    };
  }

  async generateInvoicePdf(orderId: string, customerId: string): Promise<Buffer> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } }, customer: true }
    });
    if (!order || order.customerId !== customerId) throw new UnauthorizedException('اطلاعات واردشده معتبر نیست.');

    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      doc.fontSize(20).text('INVOICE / پیش فاکتور', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Order Number: ${order.orderNumber}`);
      doc.text(`Date: ${order.createdAt.toISOString().split('T')[0]}`);
      doc.moveDown();
      
      doc.text(`Total Amount: ${order.totalAmount}`);
      doc.text(`Paid Amount: ${order.collectedAmount}`);
      doc.text(`Remaining Amount: ${order.uncollectedAmount}`);
      doc.moveDown();

      doc.text('Items:', { underline: true });
      order.items.forEach(item => {
        doc.text(`- ${item.product.name} x ${item.quantity}  =  ${item.totalPrice}`);
      });

      doc.end();
    });
  }
}
