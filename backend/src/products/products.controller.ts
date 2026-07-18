import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Roles('SystemAdmin', 'CEO', 'SalesManager')
  @Post()
  create(@Body() createProductDto: CreateProductDto, @Req() req: Request) {
    const user = req.user as any;
    return this.productsService.create(createProductDto, user.id);
  }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Roles('SystemAdmin', 'CEO', 'SalesManager')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto, @Req() req: Request) {
    const user = req.user as any;
    return this.productsService.update(id, updateProductDto, user.id);
  }

  @Roles('SystemAdmin', 'CEO', 'SalesManager')
  @Delete(':id')
  remove(@Param('id') id: string, @Body('deleteReason') reason: string, @Req() req: Request) {
    const user = req.user as any;
    return this.productsService.remove(id, user.id, reason);
  }
}
