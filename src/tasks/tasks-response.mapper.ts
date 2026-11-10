import { Finding } from './entities/finding.entity.js';


export function toTaskResponse(task: any) {
  const json = task.taskJson ?? {};

  return {
    // Дополнительные поля БД
    id: task.id,
    filePath: task.filePath,
    fileName: task.fileName,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,

    // Исходный контракт создания задачи
    prompt_version: json.prompt_version ?? task.promptVersion,
    file: json.file ?? {
      path: task.filePath,
      name: task.fileName,
    },
    summary: json.summary ?? {
      overall_quality: task.overallQuality,
      needs_context: task.needsContext,
    },
    findings: json.findings ?? [],
    improvements: json.improvements ?? [],
    parentTagName: json.parentTagName ?? task.parentTag,
    tagName: json.tagName ?? task.tagName,

    // Сохранённые в БД findings (отдельно, чтобы не ломать исходный контракт)
    savedFindings: (task.findings ?? []).map((f:Finding) => ({
      id: f.id,
      findingId: f.findingId,
      title: f.title,
      kind: f.kind,
      severity: f.severity,
      findingJson: f.findingJson,
      createdAt: f.createdAt,
    })),
  };
}