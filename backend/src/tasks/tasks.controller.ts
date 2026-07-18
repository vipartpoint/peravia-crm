import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto, @Req() req: Request) {
    const user = req.user as any;
    return this.tasksService.create(createTaskDto, user);
  }

  @Get('today')
  getTodayTasks(@Req() req: Request) {
    return this.tasksService.getTodayTasks(req.user as any);
  }

  @Get('overdue')
  getOverdueTasks(@Req() req: Request) {
    return this.tasksService.getOverdueTasks(req.user as any);
  }

  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as any;
    return this.tasksService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto, @Req() req: Request) {
    const user = req.user as any;
    return this.tasksService.update(id, updateTaskDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any;
    return this.tasksService.remove(id, user);
  }
}
