import { Controller, Get, Post, Query, Body, UseGuards, Req, Res, ForbiddenException } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ExportsService } from '../exports/exports.service';
import { PermissionsService } from '../permissions/permissions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Response, Request } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly exportsService: ExportsService,
    private readonly permissions: PermissionsService
  ) {}

  @Get('sales')
  getSales(@Query() filters: any, @Req() req: any) {
    return this.reportsService.getSalesReports(filters, req.user);
  }

  @Get('financial')
  getFinancial(@Query() filters: any, @Req() req: any) {
    return this.reportsService.getFinancialReports(filters, req.user);
  }

  @Get('crm')
  getCrm(@Query() filters: any, @Req() req: any) {
    return this.reportsService.getCrmReports(filters, req.user);
  }

  @Get('performance')
  getPerformance(@Query() filters: any, @Req() req: any) {
    return this.reportsService.getPerformanceReports(filters, req.user);
  }

  @Post('export')
  async exportReport(
    @Body('type') type: string,
    @Body('format') format: 'excel' | 'csv',
    @Body('filters') filters: any,
    @Req() req: any,
    @Res() res: Response
  ) {
    const user = req.user;
    
    // Check export permission based on type
    const category = type === 'financial' ? 'FinancialReports' : 'Reports';
    const hasPerm = await this.permissions.checkPermission(user.id, category, 'Export');
    if (!hasPerm) throw new ForbiddenException(`Missing permission: ${category}.Export`);

    const hasRevealPerm = await this.permissions.checkPermission(user.id, category, 'RevealSensitiveData');

    // Get Data
    let rawData: any[] = [];
    let columns: any[] = [];
    let fields: string[] = [];

    if (type === 'sales') {
      const report = await this.reportsService.getSalesReports(filters, user);
      rawData = report.data.map((d: any) => ({
        id: d.id,
        orderNumber: d.orderNumber,
        customer: d.customer?.name || 'Unknown',
        amount: Number(d.totalAmount),
        status: d.status,
        date: new Date(d.createdAt).toLocaleDateString('fa-IR')
      }));
      columns = [
        { header: 'Order Number', key: 'orderNumber', width: 20 },
        { header: 'Customer', key: 'customer', width: 30 },
        { header: 'Amount', key: 'amount', width: 20 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Date', key: 'date', width: 15 },
      ];
      fields = ['orderNumber', 'customer', 'amount', 'status', 'date'];
    } else if (type === 'financial') {
      const report = await this.reportsService.getFinancialReports(filters, user);
      rawData = report.data.map((d: any) => ({
        chequeNumber: hasRevealPerm ? 'DECRYPTED_MASK' : '***', // Mock decryption
        customer: d.customer?.name,
        amount: Number(d.amount),
        status: d.status,
        dueDate: new Date(d.dueDate).toLocaleDateString('fa-IR')
      }));
      columns = [
        { header: 'Cheque Number', key: 'chequeNumber', width: 20 },
        { header: 'Customer', key: 'customer', width: 30 },
        { header: 'Amount', key: 'amount', width: 20 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Due Date', key: 'dueDate', width: 15 },
      ];
      fields = ['chequeNumber', 'customer', 'amount', 'status', 'dueDate'];
    }

    // Generate output
    if (format === 'excel') {
      const buffer = await this.exportsService.exportToExcel(rawData, columns, 'Export');
      
      await this.exportsService.logExportEvent(user.id, `REPORT_${type.toUpperCase()}`, 'EXCEL', filters, req.ip || 'unknown');

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=export_${type}.xlsx`);
      return res.send(buffer);
    } else if (format === 'csv') {
      const csv = await this.exportsService.exportToCsv(rawData, fields);
      
      await this.exportsService.logExportEvent(user.id, `REPORT_${type.toUpperCase()}`, 'CSV', filters, req.ip || 'unknown');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=export_${type}.csv`);
      return res.send(csv);
    }

    throw new Error('Unsupported format');
  }
}
