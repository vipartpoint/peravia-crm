import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChequesService } from './cheques.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cheques')
export class ChequesController {
  constructor(private readonly chequesService: ChequesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  create(@Body() body: any, @UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    return this.chequesService.create(body, file, req.user);
  }

  @Get('due-soon')
  findDueSoon(@Req() req: Request) {
    return this.chequesService.findAll(req.user, 'due-soon');
  }

  @Get('overdue')
  findOverdue(@Req() req: Request) {
    return this.chequesService.findAll(req.user, 'overdue');
  }

  @Get('bounced')
  findBounced(@Req() req: Request) {
    return this.chequesService.findAll(req.user, 'bounced');
  }

  @Get()
  findAll(@Req() req: Request) {
    return this.chequesService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.chequesService.findOne(id, req.user);
  }

  @Get(':id/image')
  getChequeImage(@Param('id') id: string, @Req() req: Request) {
    return this.chequesService.getChequeImage(id, req.user);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string, @Req() req: Request) {
    return this.chequesService.updateStatus(id, status, req.user);
  }
}
