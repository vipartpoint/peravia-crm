import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStockCertificateDto } from './dto/create-stock-certificate.dto';
import moment from 'moment-jalaali';

@Injectable()
export class StockCertificatesService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateStockCertificateDto, userId: string) {
    try {
      // Generate Serial Number: {PersianYear}-{PersianMonth}-{SequentialId}
      const now = moment();
      const pYear = now.jYear().toString();
      const pMonth = (now.jMonth() + 1).toString().padStart(2, '0');
      const prefix = `${pYear}-${pMonth}`;

      const latestCert = await this.prisma.stockCertificate.findFirst({
        where: {
          serialNumber: {
            startsWith: prefix,
          },
        },
        orderBy: {
          serialNumber: 'desc',
        },
      });

      let nextSequence = 1;
      if (latestCert) {
        const parts = latestCert.serialNumber.split('-');
        const lastSequenceStr = parts[parts.length - 1];
        nextSequence = parseInt(lastSequenceStr, 10) + 1;
      }

      const seqString = nextSequence.toString().padStart(4, '0');
      const serialNumber = `${prefix}-${seqString}`;

      const finalRegistrationDate = createDto.registrationDate || now.format('jYYYY/jMM/jDD');
      
      let finalRegistrationNumber = createDto.registrationNumber;
      if (!finalRegistrationNumber) {
        const persianChars = ['ا', 'ب', 'پ', 'ت', 'ث', 'ج', 'چ', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'ژ', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ک', 'گ', 'ل', 'م', 'ن', 'و', 'ه', 'ی'];
        const randomChar = persianChars[Math.floor(Math.random() * persianChars.length)];
        finalRegistrationNumber = `${pYear}/${pMonth}/${randomChar}/${seqString}`;
      }

      const certificate = await this.prisma.stockCertificate.create({
        data: {
          serialNumber,
          shareholderName: createDto.shareholderName,
          fatherName: createDto.fatherName,
          nationalId: createDto.nationalId,
          sharesCount: createDto.sharesCount,
          shareValue: createDto.shareValue,
          totalAmount: createDto.totalAmount,
          amountInWords: createDto.amountInWords,
          shareRangeFrom: createDto.shareRangeFrom,
          shareRangeTo: createDto.shareRangeTo,
          registrationNumber: finalRegistrationNumber,
          registrationDate: finalRegistrationDate,
          registrationLocation: createDto.registrationLocation,
          registeredCapital: createDto.registeredCapital,
          issuedByUserId: userId,
        },
      });

      return certificate;
    } catch (error) {
      throw new InternalServerErrorException('Failed to create stock certificate');
    }
  }

  async findAll(filters: any) {
    const where: any = {};

    if (filters.search) {
      where.OR = [
        { shareholderName: { contains: filters.search, mode: 'insensitive' } },
        { nationalId: { contains: filters.search, mode: 'insensitive' } },
        { serialNumber: { contains: filters.search, mode: 'insensitive' } },
        { registrationNumber: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.minAmount) {
      where.totalAmount = { gte: parseFloat(filters.minAmount) };
    }

    const certificates = await this.prisma.stockCertificate.findMany({
      where,
      include: {
        issuedBy: {
          select: { id: true, username: true, email: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return certificates;
  }

  async findOne(id: string) {
    return this.prisma.stockCertificate.findUnique({
      where: { id },
      include: {
        issuedBy: {
          select: { id: true, username: true, email: true },
        },
      },
    });
  }

  async remove(id: string) {
    try {
      return await this.prisma.stockCertificate.delete({
        where: { id },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to delete stock certificate');
    }
  }
}
