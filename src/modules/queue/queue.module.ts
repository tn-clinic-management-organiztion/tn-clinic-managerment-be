import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueueTicket } from 'src/database/entities/queue/queue_tickets.entity';
import { QueueCounter } from 'src/database/entities/queue/queue_counters.entity';
import { QueueGateway } from 'src/modules/queue/services/queue.gateway';
import { QueuesService } from 'src/modules/queue/services/queue.service';
import { QueueCountersRepository } from 'src/modules/queue/repositories/queue-counters.repository';
import { QueueTicketsRepository } from 'src/modules/queue/repositories/queue-tickets.repository';
import { ClinicalModule } from 'src/modules/clinical/clinical.module';
import { TicketServiceItem } from 'src/database/entities/service/ticket_service_items.entity';
import { TicketServiceRepository } from 'src/modules/queue/repositories/ticket_service.repository';
import { QueueController } from 'src/modules/queue/controllers/queue.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([QueueTicket, QueueCounter, TicketServiceItem]),
    ClinicalModule,
  ],
  controllers: [QueueController],
  providers: [
    QueuesService,
    QueueGateway,
    QueueTicketsRepository,
    QueueCountersRepository,
    TicketServiceRepository,
  ],
  exports: [
    QueuesService,
    QueueTicketsRepository,
    QueueCountersRepository,
    TicketServiceRepository,
  ],
})
export class QueueModule {}
