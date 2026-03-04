import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ServiceRequest } from './service_requests.entity';
import { RefService } from './ref_services.entity';
import { QueueTicket } from 'src/database/entities/reception/queue_tickets.entity';

@Entity('service_request_items')
export class ServiceRequestItem {
  @PrimaryGeneratedColumn('uuid', { name: 'item_id' })
  item_id: string;

  // --- RAW FKs ---
  @Column({ name: 'queue_ticket_id', type: 'uuid', nullable: true })
  queue_ticket_id: string | null;

  @Column({ name: 'request_id', type: 'uuid', nullable: true })
  request_id: string | null;

  @Column({ name: 'service_id', type: 'int', nullable: true })
  service_id: number | null;

  // --- RELATIONS ---
  @ManyToOne(() => QueueTicket, { nullable: true })
  @JoinColumn({ name: 'queue_ticket_id', referencedColumnName: 'ticket_id' })
  queue_ticket: QueueTicket | null;

  @ManyToOne(() => ServiceRequest, { nullable: true })
  @JoinColumn({ name: 'request_id', referencedColumnName: 'request_id' })
  request: ServiceRequest | null;

  @ManyToOne(() => RefService, { nullable: true })
  @JoinColumn({ name: 'service_id', referencedColumnName: 'service_id' })
  service: RefService | null;
}