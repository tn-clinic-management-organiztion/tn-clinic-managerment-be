import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, Column } from 'typeorm';
import { AnnotationProject } from './annotation_projects.entity';
import { ResultImage } from '../service/result_images.entity';
import { StaffProfile } from '../auth/staff_profiles.entity';

@Entity('annotation_project_images')
export class AnnotationProjectImage {
  // --- KEYS ---
  @PrimaryColumn('uuid', { name: 'project_id' })
  project_id: string;

  @PrimaryColumn('uuid', { name: 'image_id' })
  image_id: string;

  // --- RAW FKs ---
  @Column({ name: 'added_by', type: 'uuid', nullable: true })
  added_by: string | null;

  // --- RELATIONS ---
  @ManyToOne(() => AnnotationProject)
  @JoinColumn({ name: 'project_id', referencedColumnName: 'project_id' })
  project: AnnotationProject;

  @ManyToOne(() => ResultImage)
  @JoinColumn({ name: 'image_id', referencedColumnName: 'image_id' })
  image: ResultImage;

  @ManyToOne(() => StaffProfile, { nullable: true })
  @JoinColumn({ name: 'added_by', referencedColumnName: 'staff_id' })
  added_by_staff?: StaffProfile;

  // --- COLUMNS ---
  @CreateDateColumn({ name: 'added_at', type: 'timestamptz' })
  added_at: Date;
}