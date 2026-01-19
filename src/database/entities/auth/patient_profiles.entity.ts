import {
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { SysUser } from './sys_users.entity';

export enum Gender {
  NAM = 'NAM',
  NU = 'NU',
  KHAC = 'KHAC',
}

@Entity('patient_profiles')
export class PatientProfile {
  @PrimaryColumn('uuid', { name: 'patient_id' })
  patient_id: string;

  // --- RELATIONS ---
  @OneToOne(() => SysUser)
  @JoinColumn({ name: 'patient_id', referencedColumnName: 'user_id' })
  user: SysUser;

  // --- COLUMNS ---
  @Column({ name: 'full_name', length: 255 })
  full_name: string;

  @Column({ name: 'dob', type: 'date' })
  dob: Date;

  @Column({ name: 'gender', type: 'enum', enum: Gender })
  gender: Gender;

  @Column({ name: 'address', type: 'text', nullable: true })
  address?: string;

  @Column({ name: 'medical_history', type: 'text', nullable: true })
  medical_history?: string;

  @Column({ name: 'allergy_history', type: 'text', nullable: true })
  allergy_history?: string;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deleted_at?: Date;
}
