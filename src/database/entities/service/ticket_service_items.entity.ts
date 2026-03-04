import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { QueueTicket } from 'src/database/entities/reception/queue_tickets.entity';
import { ServiceRequestItem } from 'src/database/entities/service/service_request_items.entity';

@Entity('ticket_service_items')
export class TicketServiceItem {
  // --- KEYS (Raw IDs) ---
  @PrimaryColumn({ name: 'ticket_id' })
  ticket_id: string;

  @PrimaryColumn({ name: 'item_id' })
  item_id: string;

  // --- RELATIONS ---
  @ManyToOne(() => QueueTicket)
  @JoinColumn({ name: 'ticket_id', referencedColumnName: 'ticket_id' })
  ticket: QueueTicket;

  @ManyToOne(() => ServiceRequestItem)
  @JoinColumn({ name: 'item_id', referencedColumnName: 'item_id' })
  service: ServiceRequestItem;
}