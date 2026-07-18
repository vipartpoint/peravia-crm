import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinancialCalculationService {
  constructor(private prisma: PrismaService) {}

  async recalculateOrderPaymentStatus(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true, cheques: true }
    });

    if (!order) return;

    // 1. Sum Confirmed Payments
    const confirmedPayments = order.payments.filter(p => p.status === 'Confirmed');
    const paymentSum = confirmedPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    // 2. Sum Cleared Cheques
    const clearedCheques = order.cheques.filter(c => c.status === 'Cleared');
    const chequeSum = clearedCheques.reduce((sum, c) => sum + Number(c.amount), 0);

    const collectedAmount = paymentSum + chequeSum;
    const uncollectedAmount = Math.max(0, Number(order.netAmount) - collectedAmount);

    let paymentStatus = 'Unpaid';
    if (collectedAmount >= Number(order.netAmount)) {
      paymentStatus = 'Paid';
    } else if (collectedAmount > 0) {
      paymentStatus = 'Partial';
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        collectedAmount,
        uncollectedAmount,
        paymentStatus,
      }
    });

    return { collectedAmount, uncollectedAmount, paymentStatus };
  }
}
