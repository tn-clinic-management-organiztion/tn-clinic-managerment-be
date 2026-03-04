import { OrgRoom } from "src/database/entities/auth/org_rooms.entity";
import { StaffProfile } from "src/database/entities/auth/staff_profiles.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('staff_room_schedules')
export class StaffRoomSchedule {
  // --- RAW FKs ---
  @PrimaryGeneratedColumn({ name: 'schedule_id' })
  schedule_id: number;

  @Column({ name: 'staff_id', type: 'uuid' })
  staff_id: string;

  @Column({ name: 'room_id', type: 'int' })
  room_id: number; 

  @Column({ name: 'work_date', type: 'date' })
  work_date: Date;

  @Column({name: 'is_active', type: 'boolean', default: true})
  is_active: boolean;

  @Column({name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP'})
  created_at: Date;

  // --- RELATIONS ---
  @ManyToOne(() => StaffProfile, { nullable: true })
  @JoinColumn({ name: 'staff_id', referencedColumnName: 'staff_id' })
  staff: StaffProfile | null;

  @ManyToOne(() => OrgRoom, { nullable: true })
  @JoinColumn({ name: 'room_id', referencedColumnName: 'room_id' })
  room: OrgRoom | null;
}