import { Controller, Post, Get, Body, Req, UseGuards, Res, Header } from '@nestjs/common';
import { CustomerPortalService } from './customer-portal.service';
import { PortalAuthGuard } from './guards/portal-auth.guard';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';


@Controller('portal')
@UseGuards(ThrottlerGuard)
export class CustomerPortalController {
  constructor(private readonly portalService: CustomerPortalService) {}

  @Throttle({ default: { limit: 5, ttl: 600000 } }) // 5 requests per 10 minutes
  @Post('order-tracking/verify')
  async verifyOrder(@Body() body: { orderNumber: string; mobile: string }) {
    return this.portalService.verifyAndGenerateToken(body.orderNumber, body.mobile);
  }

  @UseGuards(PortalAuthGuard)
  @Throttle({ default: { limit: 60, ttl: 3600000 } }) // 60 requests per hour
  @Get('orders/me')
  async getOrderSummary(@Req() req: any) {
    const { orderId, customerId } = req['portalUser'];
    return this.portalService.getOrderSummary(orderId, customerId);
  }

  @UseGuards(PortalAuthGuard)
  @Throttle({ default: { limit: 60, ttl: 3600000 } })
  @Get('orders/me/status')
  async getOrderStatus(@Req() req: any) {
    const { orderId, customerId } = req['portalUser'];
    return this.portalService.getOrderStatusTimeline(orderId, customerId);
  }

  @UseGuards(PortalAuthGuard)
  @Throttle({ default: { limit: 60, ttl: 3600000 } })
  @Get('orders/me/items')
  async getOrderItems(@Req() req: any) {
    const { orderId, customerId } = req['portalUser'];
    return this.portalService.getOrderItems(orderId, customerId);
  }

  @UseGuards(PortalAuthGuard)
  @Throttle({ default: { limit: 60, ttl: 3600000 } })
  @Get('orders/me/financials')
  async getCustomerFinancials(@Req() req: any) {
    const { customerId } = req['portalUser'];
    return this.portalService.getCustomerFinancials(customerId);
  }

  @UseGuards(PortalAuthGuard)
  @Throttle({ default: { limit: 60, ttl: 3600000 } })
  @Get('orders/me/invoice')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="invoice.pdf"')
  async getInvoicePdf(@Req() req: any, @Res() res: any) {
    const { orderId, customerId } = req['portalUser'];
    const pdfBuffer = await this.portalService.generateInvoicePdf(orderId, customerId);
    res.end(pdfBuffer);
  }
}
