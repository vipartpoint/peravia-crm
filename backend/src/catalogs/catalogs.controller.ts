import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards, Request } from '@nestjs/common';
import { CatalogsService } from './catalogs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('catalogs')
@UseGuards(JwtAuthGuard)
export class CatalogsController {
  constructor(private readonly catalogsService: CatalogsService) {}

  @Get(':type')
  findAll(@Param('type') type: string, @Query() queryParams: any) {
    if (!this.catalogsService) {
      return { error: 'CatalogsService is undefined' };
    }
    return this.catalogsService.findAll(type, queryParams);
  }

  @Get(':type/:id')
  findOne(@Param('type') type: string, @Param('id') id: string) {
    return this.catalogsService.findOne(type, id);
  }

  @Post(':type')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  create(@Param('type') type: string, @Body() data: any, @Request() req: any) {
    return this.catalogsService.create(type, data, req.user.id);
  }

  @Put(':type/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  update(@Param('type') type: string, @Param('id') id: string, @Body() data: any, @Request() req: any) {
    return this.catalogsService.update(type, id, data, req.user.id);
  }

  @Delete(':type/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('type') type: string, @Param('id') id: string, @Request() req: any) {
    return this.catalogsService.delete(type, id, req.user.id);
  }
}
