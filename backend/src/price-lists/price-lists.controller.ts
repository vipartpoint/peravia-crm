import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { PriceListsService } from './price-lists.service';
import { CreatePriceListDto } from './dto/create-price-list.dto';
import { UpdatePriceListDto } from './dto/update-price-list.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('price-lists')
export class PriceListsController {
  constructor(private readonly priceListsService: PriceListsService) {}

  @Roles('SystemAdmin', 'CEO', 'SalesManager')
  @Post()
  create(@Body() createPriceListDto: CreatePriceListDto, @Req() req: Request) {
    const user = req.user as any;
    return this.priceListsService.create(createPriceListDto, user.id);
  }

  @Get()
  findAll() {
    return this.priceListsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.priceListsService.findOne(id);
  }

  @Roles('SystemAdmin', 'CEO', 'SalesManager')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePriceListDto: UpdatePriceListDto, @Req() req: Request) {
    const user = req.user as any;
    return this.priceListsService.update(id, updatePriceListDto, user.id);
  }

  @Roles('SystemAdmin', 'CEO', 'SalesManager')
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any;
    return this.priceListsService.remove(id, user.id);
  }
}
