import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('ref_specialties')
export class RefSpecialty {
  @PrimaryGeneratedColumn({ name: 'specialty_id' })
  specialty_id: number;

  @Column({ name: 'specialty_code', length: 50, unique: true })
  specialty_code: string;

  @Column({ name: 'specialty_name', length: 255 })
  specialty_name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'is_active', default: true })
  is_active: boolean;
}
