import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

@Entity('ref_icd10')
export class RefIcd10 {
  @PrimaryColumn({ name: 'icd_code', length: 10 })
  icd_code: string;

  // --- RAW FKs ---
  @Column({ name: 'parent_code', type: 'varchar', length: 10, nullable: true })
  parent_code: string | null;

  // --- RELATIONS ---
  @ManyToOne(() => RefIcd10, {
    nullable: true,
    onUpdate: 'CASCADE',
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'parent_code', referencedColumnName: 'icd_code' })
  parent: RefIcd10 | null;

  // --- COLUMNS ---
  @Column({ name: 'name_vi', type: 'varchar', length: 500 })
  name_vi: string;

  @Column({ name: 'name_en', type: 'varchar', length: 500, nullable: true })
  name_en: string | null;

  @Column({ name: 'level', type: 'int', nullable: true })
  level: number | null;

  @Column({ name: 'is_leaf', default: false })
  is_leaf: boolean;

  @Column({ name: 'active', default: true })
  active: boolean;
}
