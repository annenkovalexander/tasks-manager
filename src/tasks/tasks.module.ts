import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller.js';
import { TasksService } from './tasks.service.js';
import { Task } from './entities/task.entity.js';
import { Finding } from './entities/finding.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Task, Finding])],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}