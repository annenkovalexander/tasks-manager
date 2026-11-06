import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThan } from 'typeorm';
import { Task } from './entities/task.entity.js';
import { Finding } from './entities/finding.entity.js';
import { CreateTaskDto } from './dto/create-task.dto.js';

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
      task.findings = task.findings.map((f) => {
        const { task: _, ...rest } = f as any;
        return rest as Finding;
      }) as any;
    }
    return task;
  }

  async createOrUpdate(dto: CreateTaskDto): Promise<{ id: number; findingsSaved: number }> {
    // Upsert по (filePath, promptVersion)
    let task = await this.taskRepo.findOne({
      where: { filePath: dto.file.path, promptVersion: dto.prompt_version },
      relations: { findings: true },
    });

    if (!task) {
      task = this.taskRepo.create();
    }

    task.filePath = dto.file.path;
    task.fileName = dto.file.name;
    task.promptVersion = dto.prompt_version;
    task.parentTag = dto.parentTagName || null;
    task.tagName = dto.tagName || null;
    task.overallQuality = dto.summary?.overall_quality || null;
    task.needsContext = dto.summary?.needs_context || false;
    task.taskJson = dto as any;

    // Пересобираем findings
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

    return { id: saved.id, findingsSaved: saved.findings.length };
  }

  async findOne(id: number): Promise<Task> {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: { findings: true },
    });
    if (!task) throw new NotFoundException(`Task #${id} not found`);
    return this.sanitize(task);
  }

  async findByFilePath(filePath?: string): Promise<Task[]> {
    const tasks = await this.taskRepo.find({
      where: filePath ? { filePath } : {},
      order: { updatedAt: 'DESC' },
      relations: { findings: true },
    });
    return tasks.map((t) => this.sanitize(t));
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

    // Полная замена всех полей
    task.filePath = dto.file.path;
    task.fileName = dto.file.name;
    task.promptVersion = dto.prompt_version;
    task.parentTag = dto.parentTagName || null;
    task.tagName = dto.tagName || null;
    task.overallQuality = dto.summary?.overall_quality || null;
    task.needsContext = dto.summary?.needs_context || false;
    task.taskJson = dto as any;

    // 1. Удаляем старые findings
    await this.findingRepo.delete({ task: { id: task.id } });

    // 2. Создаём новые
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
      // Удаляем старые findings перед заменой
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