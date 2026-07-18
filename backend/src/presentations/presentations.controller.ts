import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { PresentationsService } from './presentations.service';
import { CreatePresentationDto } from './dto/create-presentation.dto';
import { UpdatePresentationDto } from './dto/update-presentation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('presentations')
export class PresentationsController {
  constructor(private readonly presentationsService: PresentationsService) {}

  @Post()
  create(@Body() createPresentationDto: CreatePresentationDto, @Req() req: Request) {
    const user = req.user as any;
    return this.presentationsService.create(createPresentationDto, user);
  }

  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as any;
    return this.presentationsService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.presentationsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePresentationDto: UpdatePresentationDto, @Req() req: Request) {
    const user = req.user as any;
    return this.presentationsService.update(id, updatePresentationDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any;
    return this.presentationsService.remove(id, user);
  }
}
