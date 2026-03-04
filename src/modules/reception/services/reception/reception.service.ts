import { QueueTicketsRepository } from 'src/modules/reception/repositories/queue-tickets.repository';
import { ServiceRequestsService } from './../../../paraclinical/services/service-requests.service';
import { EncountersService } from './../../../clinical/services/encounters.service';
import { PatientsService } from './../../../iam/services/patients.service';
import { UsersRepository } from './../../../iam/repositories/users.repository';
import { PatientsRepository } from './../../../iam/repositories/patients.repository';
import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { CreateInitialConsultantDto } from 'src/modules/reception/dto/reception/reception.dto';
import { ReceptionRepository } from 'src/modules/reception/repositories/reception.repository';
import { CreatePatientDto } from 'src/modules/iam/dto/patients/create-patient.dto';
import { UpdatePatientDto } from 'src/modules/iam/dto/patients/update-patient.dto';
import { CreateEncounterDto } from 'src/modules/clinical/dto/encounters/create-encounter.dto';
import {
  CreateTicketDto,
  UpdateTicketDto,
} from 'src/modules/reception/dto/queue/queue.dto';
import {
  QueueStatus,
  QueueTicketType,
} from 'src/database/entities/reception/queue_tickets.entity';
import { QueuesService } from 'src/modules/reception/services/queues/queue.service';

@Injectable()
export class ReceptionService {
  constructor(
    private readonly receptionRepository: ReceptionRepository,
    private readonly patientsService: PatientsService,
    private readonly encountersService: EncountersService,
    private readonly serviceRequestsService: ServiceRequestsService,
    private readonly queuesService: QueuesService,
    private readonly dataSource: DataSource,
  ) {}

  async createInitialConsultation(dto: CreateInitialConsultantDto) {
    return await this.dataSource.transaction(async (manager) => {
      let finalPatientId = dto.patient_id;
      if (!finalPatientId) {
        const patientPayload: CreatePatientDto = {
          cccd: dto.cccd,
          full_name: dto.full_name,
          dob: dto.dob,
          gender: dto.gender,
          phone: dto.phone,
          address: dto.address,
          medical_history: dto.medical_history,
          allergy_history: dto.allergy_history,
        };
        const newPatient = await this.patientsService.create(
          patientPayload,
          manager,
        );
        finalPatientId = newPatient.patient_id;
      } else if (finalPatientId) {
        console.log('Hehehe');
        const updatePatientPayload: UpdatePatientDto = {
          cccd: dto.cccd,
          full_name: dto.full_name,
          dob: dto.dob,
          gender: dto.gender,
          phone: dto.phone,
          address: dto.address,
          medical_history: dto.medical_history,
          allergy_history: dto.allergy_history,
        };
        const uploadPatient = await this.patientsService.update(
          finalPatientId,
          updatePatientPayload,
          manager,
        );
      }
      // Create encounter
      const encounterPayload: CreateEncounterDto = {
        patient_id: finalPatientId,
        assigned_room_id: dto.assigned_room_id,
      };
      const newEncounter = await this.encountersService.create(
        encounterPayload,
        manager,
      );

      // Create service request for consultation
      const createConsultationServiceRequest =
        await this.serviceRequestsService.createInitialConsultationRequest(
          newEncounter.encounter_id,
          dto.service_id,
          manager,
        );

      // Create queueTicket for doctor
      const queueTicketPayload: CreateTicketDto = {
        room_id: dto.assigned_room_id,
        ticket_type: QueueTicketType.CONSULTATION,
        encounter_id: newEncounter.encounter_id,
        service_ids: [dto.service_id],
      };

      const createConsultationQueueTicket =
        await this.queuesService.createTicket(queueTicketPayload, manager);

      // Complete registration ticket
      const updateRegistrationTicketPayload: UpdateTicketDto = {
        status: QueueStatus.COMPLETED,
      };
      const updateCompleteRegistrationTicket = await this.queuesService.update(
        dto.ticket_id,
        updateRegistrationTicketPayload,
      );
    });
  }
}
