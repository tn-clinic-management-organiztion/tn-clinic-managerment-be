import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ResultImage } from '../service/result_images.entity';
import { StaffProfile } from '../auth/staff_profiles.entity';

export enum AnnotationSource {
  AI = 'AI',
  HUMAN = 'HUMAN',
}
export enum AnnotationStatus {
  IN_PROGRESS = 'IN_PROGRESS', // Đang làm (Draft cũ)
  SUBMITTED = 'SUBMITTED', // Đã nộp (Chờ duyệt)
  APPROVED = 'APPROVED', // Đã duyệt
  REJECTED = 'REJECTED', // Bị từ chối
  DEPRECATED = 'DEPRECATED', // Lỗi thời
}

@Entity('image_annotations')
export class ImageAnnotation {
  @PrimaryGeneratedColumn('uuid', { name: 'annotation_id' })
  annotation_id: string;

  // --- RAW FKs ---
  @Column({ name: 'image_id', type: 'uuid' })
  image_id: string | null;

  @Column({ name: 'labeled_by', type: 'uuid', nullable: true })
  labeled_by: string | null;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approved_by: string | null;

  // --- RELATIONS ---
  @ManyToOne(() => ResultImage, { nullable: false })
  @JoinColumn({ name: 'image_id', referencedColumnName: 'image_id' })
  image: ResultImage;

  @ManyToOne(() => StaffProfile, { nullable: true })
  @JoinColumn({ name: 'labeled_by', referencedColumnName: 'staff_id' })
  labeled_by_staff: StaffProfile | null;

  @ManyToOne(() => StaffProfile, { nullable: true })
  @JoinColumn({ name: 'approved_by', referencedColumnName: 'staff_id' })
  approved_by_staff: StaffProfile | null;

  // --- COLUMNS ---
  @Column({ name: 'annotation_source', type: 'enum', enum: AnnotationSource })
  annotation_source: AnnotationSource;

  @Column({ name: 'annotation_data', type: 'jsonb' })
  annotation_data: any;

  @Column({ name: 'ai_model_name', type: 'varchar', length: 100, nullable: true })
  ai_model_name: string | null;

  @Column({ name: 'ai_model_version', type: 'varchar', length: 50, nullable: true })
  ai_model_version: string | null;

  @Column({ name: 'labeled_at', type: 'timestamptz', nullable: true })
  labeled_at: Date | null;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewed_at: Date | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approved_at: Date | null;

  @Column({
    type: 'enum',
    enum: AnnotationStatus,
    default: AnnotationStatus.IN_PROGRESS,
  })
  annotation_status: AnnotationStatus;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejection_reason: string | null;

    @Column({ name: 'deprecation_reason', type: 'text', nullable: true })
  deprecation_reason: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date | null;
}
