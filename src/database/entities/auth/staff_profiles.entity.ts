import { Column, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn } from 'typeorm';
import { SysUser } from './sys_users.entity';
import { SysRole } from './sys_roles.entity';
import { OrgRoom } from './org_rooms.entity';
import { RefSpecialty } from './ref_specialties.entity';

@Entity('staff_profiles')
export class StaffProfile {
  @PrimaryColumn('uuid', { name: 'staff_id' })
  staff_id: string;

  // --- RAW FKs ---
  @Column({ name: 'role_id', type: 'int' })
  role_id: number;

  @Column({ name: 'assigned_room_id', type: 'int', nullable: true })
  assigned_room_id?: number | null;

  @Column({ name: 'specialty_id', type: 'int', nullable: true })
  specialty_id?: number | null;

  // --- RELATIONS ---
  @OneToOne(() => SysUser)
  @JoinColumn({ name: 'staff_id', referencedColumnName: 'user_id' })
  user: SysUser;

  @ManyToOne(() => SysRole, { nullable: false })
  @JoinColumn({ name: 'role_id', referencedColumnName: 'role_id' })
  role: SysRole;

  @ManyToOne(() => OrgRoom, { nullable: true })
  @JoinColumn({ name: 'assigned_room_id', referencedColumnName: 'room_id' })
  assigned_room?: OrgRoom;

  @ManyToOne(() => RefSpecialty, { nullable: true })
  @JoinColumn({ name: 'specialty_id', referencedColumnName: 'specialty_id' })
  specialty?: RefSpecialty;

  // --- COLUMNS ---
  @Column({ name: 'full_name', length: 255 })
  full_name: string;

  @Column({ name: 'signature_url', length: 500, nullable: true })
  signature_url?: string;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deleted_at?: Date;
}