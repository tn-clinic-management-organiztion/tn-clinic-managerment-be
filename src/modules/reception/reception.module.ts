import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueueTicket } from 'src/database/entities/queue/queue_tickets.entity';
import { QueueCounter } from 'src/database/entities/queue/queue_counters.entity';
import { TicketServiceItem } from 'src/database/entities/service/ticket_service_items.entity';
import { ClinicalModule } from 'src/modules/clinical/clinical.module';
import { ReceptionController } from 'src/modules/reception/controllers/reception.controller';
import { ReceptionService } from 'src/modules/reception/services/reception.service';
import { ReceptionRepository } from 'src/modules/reception/repositories/reception.repository';
import { IamModule } from 'src/modules/iam/iam.module';
import { ParaclinicalModule } from 'src/modules/paraclinical/paraclinical.module';
import { QueueModule } from 'src/modules/queue/queue.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([]),
    ClinicalModule,
    IamModule,
    ParaclinicalModule,
    QueueModule
  ],
  controllers: [ReceptionController],
  providers: [
    ReceptionService,
    ReceptionRepository,
  ],
  exports: [
    ReceptionService,
    ReceptionRepository,
  ],
})
export class ReceptionModule {}
