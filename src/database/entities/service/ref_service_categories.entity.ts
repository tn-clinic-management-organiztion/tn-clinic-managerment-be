import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('ref_service_categories')
export class RefServiceCategory {
  @PrimaryGeneratedColumn({ name: 'category_id' })
  category_id: number;

  // --- RAW FK ---
  @Column({ name: 'parent_id', type: 'int', nullable: true })
  parent_id: number | null;

  // --- RELATION ---
  @ManyToOne(() => RefServiceCategory, { nullable: true })
  @JoinColumn({ name: 'parent_id', referencedColumnName: 'category_id' })
  parent: RefServiceCategory | null;

  // --- COLUMNS ---
  @Column({ name: 'category_name', length: 255 })
  category_name: string;

  @Column({ name: 'is_system_root', default: false })
  is_system_root: boolean;
}