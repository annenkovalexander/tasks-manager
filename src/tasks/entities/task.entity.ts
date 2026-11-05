import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  OneToMany, Index,
} from 'typeorm';
import type { Finding } from './finding.entity.js';

@Entity('tasks')
@Index(['filePath', 'promptVersion'], { unique: true })
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'file_path', type: 'text' })
  filePath: string;

  @Column({ name: 'file_name', type: 'text' })
  fileName: string;

  @Column({ name: 'prompt_version', type: 'text' })
  promptVersion: string;

  @Column({ name: 'parent_tag', type: 'text', nullable: true })
  parentTag: string | null;

  @Column({ name: 'tag_name', type: 'text', nullable: true })
  tagName: string | null;

  @Column({ name: 'overall_quality', type: 'text', nullable: true })
  overallQuality: string | null;

  @Column({ name: 'needs_context', type: 'boolean', default: false })
  needsContext: boolean;

  @Column({ type: 'jsonb' })
  taskJson: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany('Finding', (finding: Finding) => finding.task, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  findings: Finding[];
}