import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import type { Task } from './task.entity.js';

@Entity('findings')
@Index(['task', 'findingId'], { unique: true })
@Index(['kind'])
export class Finding {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne('Task', (task: Task) => task.findings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Column({ name: 'finding_id', type: 'text' })
  findingId: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text' })
  kind: string;

  @Column({ type: 'text', nullable: true })
  category: string | null;

  @Column({ type: 'text', nullable: true })
  severity: string | null;

  @Column({ type: 'text', nullable: true })
  confidence: string | null;

  @Column({ name: 'release_impact', type: 'text', nullable: true })
  releaseImpact: string | null;

  @Column({ name: 'finding_json', type: 'jsonb' })
  findingJson: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}