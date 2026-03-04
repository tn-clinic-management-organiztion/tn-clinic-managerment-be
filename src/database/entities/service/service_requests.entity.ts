import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MedicalEncounter } from '../clinical/medical_encounters.entity';
import { StaffProfile } from '../auth/staff_profiles.entity';

@Entity('service_requests')
export class ServiceRequest {
  @PrimaryGeneratedColumn('uuid', { name: 'request_id' })
  request_id: string;

  // --- RAW FKs ---
  @Column({ name: 'encounter_id', type: 'uuid', nullable: true })
  encounter_id: string | null;

  @Column({ name: 'requesting_doctor_id', type: 'uuid', nullable: true })
  requesting_doctor_id: string | null;

  // --- RELATIONS ---
  @ManyToOne(() => MedicalEncounter, { nullable: true })
  @JoinColumn({ name: 'encounter_id', referencedColumnName: 'encounter_id' })
  encounter: MedicalEncounter | null;

  @ManyToOne(() => StaffProfile, { nullable: true })
  @JoinColumn({
    name: 'requesting_doctor_id',
    referencedColumnName: 'staff_id',
  })
  requesting_doctor: StaffProfile | null;

  // --- COLUMNS ---
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string | null;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deleted_at: Date | null;
}
