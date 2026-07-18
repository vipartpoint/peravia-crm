import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { parse } from 'json2csv';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExportsService {
  constructor(private prisma: PrismaService) {}

  async exportToExcel(data: any[], columns: { header: string, key: string, width?: number }[], sheetName: string = 'Report'): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    worksheet.columns = columns;

    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { horizontal: 'center' };

    // Add data
    data.forEach(row => {
      worksheet.addRow(row);
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportToCsv(data: any[], fields: string[]): Promise<string> {
    if (!data || data.length === 0) return '';
    try {
      const csv = parse(data, { fields });
      return csv;
    } catch (err) {
      console.error(err);
      return '';
    }
  }

  async logExportEvent(userId: string, reportType: string, format: string, filters: any, reqIp: string) {
    let action = 'EXPORT_REPORT';
    if (reportType.includes('FINANCIAL') || reportType.includes('CHEQUE') || reportType.includes('PAYMENT')) {
      action = 'EXPORT_FINANCIAL_REPORT';
    } else if (reportType.includes('CUSTOMER')) {
      action = 'EXPORT_CUSTOMER_DATA';
    }

    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType: 'Export',
        entityId: reportType,
        ipAddress: reqIp,
      }
    });
  }
}
