import { Controller, Get, Post, Delete, Body, Param, UseGuards, Query, Req, UnauthorizedException } from '@nestjs/common';
import { StockCertificatesService } from './stock-certificates.service';
import { CreateStockCertificateDto } from './dto/create-stock-certificate.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('stock-certificates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StockCertificatesController {
  constructor(private readonly stockCertificatesService: StockCertificatesService) {}

  @Post()
  @Roles('SystemAdmin', 'Admin')
  create(@Body() createStockCertificateDto: CreateStockCertificateDto, @Req() req: any) {
    if (!req.user || !req.user.id) {
      throw new UnauthorizedException();
    }
    return this.stockCertificatesService.create(createStockCertificateDto, req.user.id);
  }

  @Get()
  @Roles('SystemAdmin', 'Admin')
  findAll(@Query() query: any) {
    return this.stockCertificatesService.findAll(query);
  }

  @Get(':id')
  @Roles('SystemAdmin', 'Admin')
  findOne(@Param('id') id: string) {
    return this.stockCertificatesService.findOne(id);
  }

  @Delete(':id')
  @Roles('SystemAdmin', 'Admin')
  remove(@Param('id') id: string) {
    return this.stockCertificatesService.remove(id);
  }
}
