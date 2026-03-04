import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RefServiceCategory } from './ref_service_categories.entity';

@Entity('ref_services')
export class RefService {
  @PrimaryGeneratedColumn({ name: 'service_id' })
  service_id: number;

  // --- RAW FK ---
  @Column({ name: 'category_id', type: 'int', nullable: true })
  category_id: number | null;

  // --- RELATION ---
  @ManyToOne(() => RefServiceCategory, { nullable: true })
  @JoinColumn({ name: 'category_id', referencedColumnName: 'category_id' })
  category: RefServiceCategory | null;

  // --- COLUMNS ---
  @Column({ name: 'service_name', length: 255 })
  service_name: string;

  @Column({
    name: 'unit_price',
    type: 'numeric',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  unit_price: string | null;
}
