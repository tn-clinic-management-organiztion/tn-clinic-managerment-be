import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { MedicalEncounter } from '../clinical/medical_encounters.entity';
import { OrgRoom } from '../auth/org_rooms.entity';

export enum QueueTicketType {
  REGISTRATION = 'REGISTRATION',
  CONSULTATION = 'CONSULTATION',
  SERVICE = 'SERVICE',
}
export enum QueueSource {
  ONLINE = 'ONLINE',
  WALKIN = 'WALKIN',
}
export enum QueueStatus {
  WAITING = 'WAITING',
  CALLED = 'CALLED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
}
@Entity('queue_tickets')
export class QueueTicket {
  @PrimaryGeneratedColumn('uuid', { name: 'ticket_id' })
  ticket_id: string;

  @Column({ name: 'encounter_id', type: 'uuid', nullable: true })
  encounter_id: string | null;

  @Column({ name: 'room_id', type: 'int' })
  room_id: number;

  // --- RELATIONS ---
  @ManyToOne(() => MedicalEncounter, { nullable: true })
  @JoinColumn({ name: 'encounter_id', referencedColumnName: 'encounter_id' })
  encounter: MedicalEncounter | null;

  @ManyToOne(() => OrgRoom, { nullable: false })
  @JoinColumn({ name: 'room_id', referencedColumnName: 'room_id' })
  room: OrgRoom;

  // --- COLUMNS ---
  @Column({ name: 'ticket_type', type: 'enum', enum: QueueTicketType })
  ticket_type: QueueTicketType;

  @Column({ name: 'display_number', type: 'int' })
  display_number: number;

  @Column({
    name: 'source',
    type: 'enum',
    enum: QueueSource,
    default: QueueSource.WALKIN,
  })
  source: QueueSource;

  @Column({
    name: 'status',
    type: 'enum',
    enum: QueueStatus,
    default: QueueStatus.WAITING,
  })
  status: QueueStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @Column({ name: 'called_at', type: 'timestamptz', nullable: true })
  called_at: Date | null;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  started_at: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completed_at: Date | null;
}
