import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StaffProfile } from '../auth/staff_profiles.entity';

export enum AnnotationTaskType {
  CLASSIFICATION = 'CLASSIFICATION',
  BOUNDING_BOX = 'BOUNDING_BOX',
  SEGMENTATION = 'SEGMENTATION',
  KEYPOINT = 'KEYPOINT',
  OCR = 'OCR',
  OTHER = 'OTHER',
}

@Entity('annotation_projects')
export class AnnotationProject {
  @PrimaryGeneratedColumn('uuid', { name: 'project_id' })
  project_id: string;

  // --- RAW FKs ---
  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  created_by: string | null;

  // --- RELATIONS ---
  @ManyToOne(() => StaffProfile, { nullable: true })
  @JoinColumn({ name: 'created_by', referencedColumnName: 'staff_id' })
  creator: StaffProfile | null;

  // --- COLUMNS ---
  @Column({ name: 'name', length: 255 })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'task_type', type: 'enum', enum: AnnotationTaskType })
  task_type: AnnotationTaskType;

  @Column({ name: 'is_active', default: true })
  is_active: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;
}
