import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Task } from './entities/task.entity.js';
import { Finding } from './entities/finding.entity.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { toTaskResponse } from './tasks-response.mapper.js';


@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(Finding)
    private readonly findingRepo: Repository<Finding>,
  ) {}


  // Убирает обратную ссылку task у findings, чтобы JSON не зацикливался
  private sanitize(task: Task): Task {
    if (task.findings) {
      task.findings = task.findings.map((f: Finding) => {
        const { task: _, ...rest } = f as any;
        return rest as Finding;
      });
    }
    return task;
  }


  async createOrUpdate(payload: CreateTaskDto): Promise<Task> {
    const { prompt_version, file, summary, findings, parentTagName, tagName } = payload;


    // 1. Ищем существующую задачу по уникальной паре
    let task = await this.taskRepo.findOne({
      where: {
        filePath: file.path,
        promptVersion: prompt_version,
      },
      relations: { findings: true },
    });


    // 2. Если нет — создаём новую
    if (!task) {
      task = this.taskRepo.create({
        filePath: file.path,
        fileName: file.name ?? '',
        promptVersion: prompt_version,
        parentTag: parentTagName ?? null,
        tagName: tagName ?? null,
        overallQuality: summary.overall_quality,
        needsContext: summary.needs_context,
        taskJson: payload,
      });
    } else {
      // 3. Если есть — обновляем поля
      task.fileName = file.name ?? '';
      task.parentTag = parentTagName ?? null;
      task.tagName = tagName ?? null;
      task.overallQuality = summary.overall_quality ?? null;
      task.needsContext = summary.needs_context ?? false;
      task.taskJson = payload;
    }


    // 4. Сохраняем task
    await this.taskRepo.save(task);


    // 5. Удаляем старые findings
    await this.findingRepo.delete({ task: { id: task.id } });


    // 6. Вставляем новые findings
    const newFindings = findings.map((f) =>
      this.findingRepo.create({
        task,
        findingId: f.id,
        title: f.title,
        kind: f.kind,
        severity: f.severity,
        findingJson: f,
      }),
    );


    await this.findingRepo.save(newFindings);


    // 7. Возвращаем задачу со свежими findings
    const updated = await this.taskRepo.findOne({
      where: { id: task.id },
      relations: { findings: true },
    });


    if (!updated) {
      throw new NotFoundException(`Task with id ${task.id} not found after save`);
    }


    return updated;
  }


  async findOne(id: number) {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: { findings: true },
    });
    if (!task) throw new NotFoundException(`Task #${id} not found`);
    return toTaskResponse(this.sanitize(task));
  }


  async findByFilePath(filePath?: string) {
    const tasks = await this.taskRepo.find({
      where: filePath ? { filePath } : {},
      order: { updatedAt: 'DESC' },
      relations: { findings: true },
    });
    return tasks.map((t) => toTaskResponse(this.sanitize(t)));
  }


  async findNeedsContext(): Promise<Finding[]> {
    return this.findingRepo.find({ where: { kind: 'needs_context' } });
  }


  async replace(id: number, dto: CreateTaskDto): Promise<Task> {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: { findings: true },
    });
    if (!task) throw new NotFoundException(`Task #${id} not found`);


    task.filePath = dto.file.path;
    task.fileName = dto.file.name;
    task.promptVersion = dto.prompt_version;
    task.parentTag = dto.parentTagName || null;
    task.tagName = dto.tagName || null;
    task.overallQuality = dto.summary?.overall_quality || null;
    task.needsContext = dto.summary?.needs_context || false;
    task.taskJson = dto as any;


    await this.findingRepo.delete({ task: { id: task.id } });


    task.findings = (dto.findings || []).map((f) => {
      const finding = this.findingRepo.create();
      finding.findingId = f.id;
      finding.title = f.title;
      finding.kind = f.kind;
      finding.category = f.category || null;
      finding.severity = f.severity || null;
      finding.confidence = f.confidence || null;
      finding.releaseImpact = f.release_impact || null;
      finding.findingJson = f as any;
      finding.task = task;
      return finding;
    });


    const saved = await this.taskRepo.save(task);
    return this.sanitize(saved);
  }


  async update(id: number, dto: Partial<CreateTaskDto>): Promise<Task> {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: { findings: true },
    });
    if (!task) throw new NotFoundException(`Task #${id} not found`);


    if (dto.file) {
      task.filePath = dto.file.path;
      task.fileName = dto.file.name;
    }
    if (dto.prompt_version) {
      task.promptVersion = dto.prompt_version;
    }
    if (dto.parentTagName !== undefined) {
      task.parentTag = dto.parentTagName || null;
    }
    if (dto.tagName !== undefined) {
      task.tagName = dto.tagName || null;
    }
    if (dto.summary) {
      if (dto.summary.overall_quality !== undefined) {
        task.overallQuality = dto.summary.overall_quality || null;
      }
      if (dto.summary.needs_context !== undefined) {
        task.needsContext = dto.summary.needs_context;
      }
    }
    if (dto.findings) {
      await this.findingRepo.delete({ task: { id: task.id } });


      task.findings = dto.findings.map((f) => {
        const finding = this.findingRepo.create();
        finding.findingId = f.id;
        finding.title = f.title;
        finding.kind = f.kind;
        finding.category = f.category || null;
        finding.severity = f.severity || null;
        finding.confidence = f.confidence || null;
        finding.releaseImpact = f.release_impact || null;
        finding.findingJson = f as any;
        finding.task = task;
        return finding;
      });
    }


    const saved = await this.taskRepo.save(task);
    return this.sanitize(saved);
  }


  async remove(id: number): Promise<{ deleted: boolean }> {
    const result = await this.taskRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Task #${id} not found`);
    }
    return { deleted: true };
  }


  async removeAll(): Promise<{ deleted: number }> {
    const result = await this.taskRepo.delete({ id: MoreThan(0) });
    return { deleted: result.affected || 0 };
  }
}