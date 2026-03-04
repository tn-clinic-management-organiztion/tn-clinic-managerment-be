import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
} from 'typeorm';
import { PatientProfile } from '../auth/patient_profiles.entity';
import { StaffProfile } from '../auth/staff_profiles.entity';
import { OrgRoom } from '../auth/org_rooms.entity';
import { RefIcd10 } from './ref_icd10.entity';

export enum EncounterStatus {
  REGISTERED = 'REGISTERED',
  AWAITING_PAYMENT = 'AWAITING_PAYMENT',
  IN_CONSULTATION = 'IN_CONSULTATION',
  COMPLETED = 'COMPLETED',
}

// Helper để chuyển đổi Numeric (Postgres) sang Number (JS)
const numericTransformer = {
  to: (value: number | null) => value,
  from: (value: string | null) => (value === null ? null : parseFloat(value)),
};

@Entity('medical_encounters')
export class MedicalEncounter {
  @PrimaryGeneratedColumn('uuid', { name: 'encounter_id' })
  encounter_id: string;

  // --- RAW FKs ---
  @Column({ name: 'patient_id', type: 'uuid', nullable: true })
  patient_id: string | null;

  @Column({ name: 'doctor_id', type: 'uuid', nullable: true })
  doctor_id: string | null;

  @Column({ name: 'final_icd_code', type: 'varchar', length: 10, nullable: true })
  final_icd_code: string | null;

  // --- RELATIONS ---
  @ManyToOne(() => PatientProfile, { nullable: true })
  @JoinColumn({ name: 'patient_id', referencedColumnName: 'patient_id' })
  patient: PatientProfile | null;

  @ManyToOne(() => StaffProfile, { nullable: true })
  @JoinColumn({ name: 'doctor_id', referencedColumnName: 'staff_id' })
  doctor: StaffProfile | null;

  @ManyToOne(() => RefIcd10, { nullable: true })
  @JoinColumn({ name: 'final_icd_code', referencedColumnName: 'icd_code' })
  icd_ref: RefIcd10 | null;

  // --- COLUMNS ---
  @Column({ name: 'visit_date', type: 'timestamptz', default: () => 'NOW()' })
  visit_date: Date;

  @Column({
    name: 'current_status',
    type: 'enum',
    enum: EncounterStatus,
    default: EncounterStatus.REGISTERED,
  })
  current_status: EncounterStatus;

  @Column({ name: 'initial_symptoms', type: 'text', nullable: true })
  initial_symptoms: string | null ;

  // --- VITAL SIGNS (CHỈ SỐ SINH HIỆU) ---
  @Column({
    name: 'weight',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  weight: number | null; // Cân nặng (kg)

  @Column({
    name: 'height',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  height: number | null; // Chiều cao (cm)

  @Column({
    name: 'bmi',
    type: 'numeric',
    precision: 4,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  bmi: number | null; // BMI

  @Column({
    name: 'temperature',
    type: 'numeric',
    precision: 4,
    scale: 1,
    nullable: true,
    transformer: numericTransformer,
  })
  temperature: number | null; // Nhiệt độ (°C)

  @Column({ name: 'pulse', type: 'int', nullable: true })
  pulse: number | null; // Mạch (lần/phút)

  @Column({ name: 'respiratory_rate', type: 'int', nullable: true })
  respiratory_rate: number | null; // Nhịp thở (lần/phút)

  @Column({ name: 'bp_systolic', type: 'int', nullable: true })
  bp_systolic: number | null; // Huyết áp tâm thu (số trên)

  @Column({ name: 'bp_diastolic', type: 'int', nullable: true })
  bp_diastolic: number | null; // Huyết áp tâm trương (số dưới)

  @Column({
    name: 'sp_o2',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  sp_o2: number | null; // SpO2 (%)

  // --- CONCLUSIONS ---
  @Column({ name: 'doctor_conclusion', type: 'text', nullable: true })
  doctor_conclusion: string | null;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deleted_at: Date | null;
}