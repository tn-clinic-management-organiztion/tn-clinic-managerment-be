import {
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ServiceRequestItem } from './service_request_items.entity';
import { StaffProfile } from '../auth/staff_profiles.entity';
import { DataSource } from 'typeorm';
import { ResultImage } from 'src/database/entities/service/result_images.entity';

@Entity('service_results')
export class ServiceResult {
  @PrimaryGeneratedColumn('uuid', { name: 'result_id' })
  result_id: string;

  // --- RAW FKs ---
  @Column({ name: 'request_item_id', type: 'uuid', nullable: true })
  request_item_id: string | null;

  @Column({ name: 'technician_id', type: 'uuid', nullable: true })
  technician_id: string | null;

  // --- RELATIONS ---
  @ManyToOne(() => ServiceRequestItem, { nullable: true })
  @JoinColumn({ name: 'request_item_id', referencedColumnName: 'item_id' })
  request_item: ServiceRequestItem | null;

  @ManyToOne(() => StaffProfile, { nullable: true })
  @JoinColumn({ name: 'technician_id', referencedColumnName: 'staff_id' })
  technician: StaffProfile | null;

  // --- COLUMNS ---
  @Column({ name: 'main_conclusion', type: 'text', nullable: true })
  main_conclusion: string | null;

  @Column({ name: 'report_body_html', type: 'text', nullable: true })
  report_body_html: string | null;

  @Column({ name: 'is_abnormal', default: false })
  is_abnormal: boolean;

  @Column({ name: 'result_time', type: 'timestamptz', default: () => 'NOW()' })
  result_time: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deleted_at: Date | null;

  @OneToMany(() => ResultImage, (img) => img.result)
  images: ResultImage[];
}
