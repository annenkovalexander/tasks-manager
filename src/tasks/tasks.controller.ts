import {
  Controller, Get, Post, Body, Param, Query, ParseIntPipe, Patch, Delete, Put,
} from '@nestjs/common';
import { TasksService } from './tasks.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';


@Controller('api/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}


  @Post()
  async create(@Body() dto: CreateTaskDto) {
    return this.tasksService.createOrUpdate(dto);
  }


  @Get()
  async findAll(@Query('file_path') filePath?: string) {
    return this.tasksService.findByFilePath(filePath);
  }


  @Get('needs-context')
  async findNeedsContext() {
    return this.tasksService.findNeedsContext();
  }


  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.findOne(id);
  }


  @Put(':id')
  async replace(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.replace(id, dto);
  }


  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateTaskDto>,
  ) {
    return this.tasksService.update(id, dto);
  }


  @Delete()
  async removeAll() {
    return this.tasksService.removeAll();
  }


  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.remove(id);
  }
}