import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueueTicket } from 'src/database/entities/reception/queue_tickets.entity';
import { QueueCounter } from 'src/database/entities/reception/queue_counters.entity';
import { QueueController } from 'src/modules/reception/controllers/queue.controller';
import { QueueGateway } from 'src/modules/reception/services/queues/queue.gateway';
import { QueuesService } from 'src/modules/reception/services/queues/queue.service';
import { QueueCountersRepository } from 'src/modules/reception/repositories/queue-counters.repository';
import { QueueTicketsRepository } from 'src/modules/reception/repositories/queue-tickets.repository';
import { ClinicalModule } from 'src/modules/clinical/clinical.module';
import { ReceptionController } from 'src/modules/reception/controllers/reception.controller';
import { ReceptionService } from 'src/modules/reception/services/reception/reception.service';
import { ReceptionRepository } from 'src/modules/reception/repositories/reception.repository';
import { IamModule } from 'src/modules/iam/iam.module';
import { ParaclinicalModule } from 'src/modules/paraclinical/paraclinical.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([QueueTicket, QueueCounter]),
    ClinicalModule, IamModule, ParaclinicalModule
  ],
  controllers: [QueueController, ReceptionController],
  providers: [
    QueuesService,
    QueueGateway,
    QueueTicketsRepository,
    QueueCountersRepository,
    ReceptionService,
    ReceptionRepository,
  ],
  exports: [
    QueuesService,
    QueueTicketsRepository,
    QueueCountersRepository,
    ReceptionService,
    ReceptionRepository,
  ],
})
export class ReceptionModule {}
