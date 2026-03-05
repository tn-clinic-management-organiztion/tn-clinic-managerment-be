import { EncountersService } from '../../clinical/services/encounters.service';
import { PatientsService } from '../../iam/services/patients.service';
import { DataSource } from 'typeorm';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateInitialConsultantDto } from 'src/modules/reception/dto/reception.dto';
import { ReceptionRepository } from 'src/modules/reception/repositories/reception.repository';

import {
  QueueStatus,
  QueueTicketType,
} from 'src/database/entities/queue/queue_tickets.entity';
import { QueuesService } from 'src/modules/queue/services/queue.service';
import { ServiceRequestsRepository } from 'src/modules/paraclinical/repositories/service-requests/service-requests.repository';
import { ServiceRequestItemsRepository } from 'src/modules/paraclinical/repositories/service-requests/service-request-items.repository';
import { TicketServiceItem } from 'src/database/entities/service/ticket_service_items.entity';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class ReceptionService {
  constructor(
    private readonly receptionRepository: ReceptionRepository,
    private readonly patientsService: PatientsService,
    private readonly encountersService: EncountersService,
    private readonly queuesService: QueuesService,
    private readonly serviceRequestsRepository: ServiceRequestsRepository,
    private readonly serviceRequestItemsRepository: ServiceRequestItemsRepository,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

    async createInitialConsultation(dto: CreateInitialConsultantDto) {
    return await this.dataSource.transaction(async (manager) => {
      // 1. Handle patient
      let finalPatientId = dto.patient_id;
      
      if (!finalPatientId) {
        // Create new patient
        const newPatient = await this.patientsService.create(
          {
            cccd: dto.cccd,
            full_name: dto.full_name,
            dob: dto.dob,
            gender: dto.gender,
            phone: dto.phone,
            address: dto.address,
            medical_history: dto.medical_history,
            allergy_history: dto.allergy_history,
          },
          manager,
        );
        finalPatientId = newPatient.patient_id;
      } else {
        // Update existing patient
        await this.patientsService.update(
          finalPatientId,
          {
            cccd: dto.cccd,
            full_name: dto.full_name,
            dob: dto.dob,
            gender: dto.gender,
            phone: dto.phone,
            address: dto.address,
            medical_history: dto.medical_history,
            allergy_history: dto.allergy_history,
          },
          manager,
        );
      }

      // 2. Create encounter
      const newEncounter = await this.encountersService.create(
        { patient_id: finalPatientId },
        manager,
      );

      // 3. Create service_request (initial consultation)
      const serviceRequest = 
        await this.serviceRequestsRepository.createServiceRequest(
          newEncounter.encounter_id,
          undefined, // requesting_doctor_id = null (lễ tân tạo)
          manager,
        );

      // 4. Create service_request_item
      const serviceRequestItem = 
        await this.serviceRequestItemsRepository.createServiceRequestItem(
          serviceRequest.request_id,
          dto.service_id,
          manager,
        );

      // 5. Create queue_ticket for consultation
      const consultationTicket = await this.queuesService.createTicket(
        {
          room_id: dto.assigned_room_id,
          ticket_type: QueueTicketType.CONSULTATION,
          encounter_id: newEncounter.encounter_id,
        },
        manager,
      );

      // 6. Link ticket + item via ticket_service_items
      await manager.getRepository(TicketServiceItem).insert({
        ticket_id: consultationTicket.ticket_id,
        item_id: serviceRequestItem.item_id,
      });

      // 7. Complete registration ticket
      await this.queuesService.update(dto.ticket_id, {
        status: QueueStatus.COMPLETED,
      });

      // 8. Return result
      return {
        patient_id: finalPatientId,
        encounter_id: newEncounter.encounter_id,
        ticket_id: consultationTicket.ticket_id,
        display_number: consultationTicket.display_number,
      };
    });
  }
}
