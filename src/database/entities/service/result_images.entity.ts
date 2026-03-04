import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ServiceResult } from './service_results.entity';
import { StaffProfile } from '../auth/staff_profiles.entity';
import { ImageAnnotation } from 'src/database/entities/ai/image_annotations.entity';

@Entity('result_images')
export class ResultImage {
  @PrimaryGeneratedColumn('uuid', { name: 'image_id' })
  image_id: string;

  // --- RAW FKs ---
  @Column({ name: 'result_id', type: 'uuid', nullable: true })
  result_id: string | null;

  @Column({ name: 'uploaded_by', type: 'uuid', nullable: true })
  uploaded_by: string | null;

  // --- RELATIONS ---
  @ManyToOne(() => ServiceResult, { nullable: true })
  @JoinColumn({ name: 'result_id', referencedColumnName: 'result_id' })
  result: ServiceResult | null;

  @ManyToOne(() => StaffProfile, { nullable: true })
  @JoinColumn({ name: 'uploaded_by', referencedColumnName: 'staff_id' })
  uploader: StaffProfile | null;

  @OneToMany(() => ImageAnnotation, (ann) => ann.image)
  annotations: ImageAnnotation[];

  // --- COLUMNS ---
  @Column({ name: 'public_id', type: 'varchar', length: 255, nullable: true })
  public_id: string | null;

  @Column({ name: 'original_image_url', type: 'varchar', length: 500 })
  original_image_url: string;

  @Column({ name: 'file_name', type: 'varchar', length: 255, nullable: true })
  file_name: string | null;

  @Column({ name: 'file_size', type: 'bigint', nullable: true })
  file_size: string | null;

  @Column({name: 'image_width', type: 'int', nullable: true })
  image_width: number | null;

  @Column({name: 'image_height', type: 'int', nullable: true })
  image_height: number | null;

  @Column({ name: 'mime_type', type: 'varchar', length: 100, nullable: true })
  mime_type: string | null;

  @CreateDateColumn({ name: 'uploaded_at', type: 'timestamptz' })
  uploaded_at: Date;
}
