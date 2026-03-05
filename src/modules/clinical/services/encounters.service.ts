import { PatientsRepository } from './../../iam/repositories/patients.repository';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import {
  EncounterStatus,
  MedicalEncounter,
} from '../../../database/entities/clinical/medical_encounters.entity';

import {
  QueueStatus,
  QueueTicket,
} from 'src/database/entities/queue/queue_tickets.entity';
import { CreateEncounterDto } from 'src/modules/clinical/dto/encounters/create-encounter.dto';
import { StaffsRepository } from 'src/modules/iam/repositories/staffs.repository';
import { EncountersRepository } from 'src/modules/clinical/repositories/encounters.repository';
import { QueryEncounterDto } from 'src/modules/clinical/dto/encounters/query-encounter.dto';
import { Icd10Repository } from 'src/modules/system/repositories/icd10.repository';
import { UpdateEncounterDto } from 'src/modules/clinical/dto/encounters/update-encounter.dto';
import {
  CompleteConsultationDto,
  StartConsultationDto,
} from 'src/modules/clinical/dto/encounters/action-consultation.dto';

@Injectable()
export class EncountersService {
  constructor(
    private readonly encounterRepository: EncountersRepository,
    private readonly icd10Repository: Icd10Repository,
    private readonly patientsRepository: PatientsRepository,
    private readonly staffsRepository: StaffsRepository,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async create(
    dto: CreateEncounterDto,
    manager?: EntityManager,
  ): Promise<MedicalEncounter> {
    const execute = async (mgr: EntityManager) => {
      // Validate patient_id exists
      const patientExists = await this.patientsRepository.findById(
        dto.patient_id,
        mgr,
      );

      if (!patientExists) {
        throw new NotFoundException(
          `Patient with ID ${dto.patient_id} not found`,
        );
      }

      // Validate doctor_id if provided
      if (dto.doctor_id) {
        const doctorExists = await this.staffsRepository.findById(
          dto.doctor_id,
          mgr,
        );

        if (!doctorExists) {
          throw new NotFoundException(
            `Doctor with ID ${dto.doctor_id} not found`,
          );
        }
      }
      const encounter = await this.encounterRepository.createEncounter(
        dto,
        mgr,
      );

      return encounter;
    };
    if (manager) {
      return await execute(manager);
    } else {
      return await this.dataSource.transaction(async (newManager) => {
        return await execute(newManager);
      });
    }
  }

  async findAllEncounters(query: QueryEncounterDto) {
    return await this.dataSource.transaction(async (manager) => {
      const [encounters, total] =
        await this.encounterRepository.findAllEncounters(query, manager);
      return {
        data: encounters,
        meta: {
          page: query.page || 1,
          limit: query.limit || 20,
          total,
          totalPages: Math.ceil(total / (query.limit || 20)),
        },
      };
    });
  }

  async findDetailEncounter(id: string) {
    return this.dataSource.transaction(async (manager) => {
      const encounter = await this.encounterRepository.findDetailById(
        id,
        manager,
      );
      if (!encounter) {
        throw new NotFoundException(`Encounter with ID ${id} not found`);
      }
      const patient_phone = (encounter as any)?.patient?.user?.phone ?? null;
      delete (encounter as any)?.patient?.user;
      return {
        ...encounter,
        patient_phone,
      };
    });
  }

  async update(id: string, dto: UpdateEncounterDto): Promise<MedicalEncounter> {
    return await this.dataSource.transaction(async (manager) => {
      const encounter = await this.encounterRepository.findById(id, manager);
      if (!encounter) {
        throw new NotFoundException(`Encounter with ID ${id} not found`);
      }
      // Validate ICD code if provided
      if (dto.final_icd_code) {
        const icdExists = await this.icd10Repository.checkIcd10Exists(
          dto.final_icd_code,
          manager,
        );
        if (!icdExists) {
          throw new NotFoundException(
            `ICD code ${dto.final_icd_code} not found`,
          );
        }
      }

      // Validate vital signs
      // Temperature (°C): sanity range 30.0 - 45.0
      if (dto.temperature !== undefined && dto.temperature !== null) {
        if (dto.temperature < 30 || dto.temperature > 45) {
          throw new BadRequestException(
            `temperature must be between 30 and 45 °C`,
          );
        }
      }

      // Pulse (bpm): 20 - 250 (int)
      if (dto.pulse !== undefined && dto.pulse !== null) {
        if (dto.pulse < 20 || dto.pulse > 250) {
          throw new BadRequestException(`pulse must be between 20 and 250 bpm`);
        }
      }

      // Respiratory rate (breaths/min): 4 - 80 (int)
      if (dto.respiratory_rate !== undefined && dto.respiratory_rate !== null) {
        if (dto.respiratory_rate < 4 || dto.respiratory_rate > 80) {
          throw new BadRequestException(
            `respiratory_rate must be between 4 and 80 breaths/min`,
          );
        }
      }

      // Blood pressure systolic (mmHg): 50 - 260 (int)
      if (dto.bp_systolic !== undefined && dto.bp_systolic !== null) {
        if (dto.bp_systolic < 50 || dto.bp_systolic > 260) {
          throw new BadRequestException(
            `bp_systolic must be between 50 and 260 mmHg`,
          );
        }
      }

      // Blood pressure diastolic (mmHg): 30 - 180 (int)
      if (dto.bp_diastolic !== undefined && dto.bp_diastolic !== null) {
        if (dto.bp_diastolic < 30 || dto.bp_diastolic > 180) {
          throw new BadRequestException(
            `bp_diastolic must be between 30 and 180 mmHg`,
          );
        }
      }

      // Cross-check: diastolic < systolic
      if (
        dto.bp_systolic !== undefined &&
        dto.bp_systolic !== null &&
        dto.bp_diastolic !== undefined &&
        dto.bp_diastolic !== null
      ) {
        if (dto.bp_diastolic >= dto.bp_systolic) {
          throw new BadRequestException(
            `bp_diastolic must be less than bp_systolic`,
          );
        }
      }

      // SpO2 (%): 0 - 100
      if (dto.sp_o2 !== undefined && dto.sp_o2 !== null) {
        if (dto.sp_o2 < 0 || dto.sp_o2 > 100) {
          throw new BadRequestException(`sp_o2 must be between 0 and 100 %`);
        }
      }

      // Weight (kg): 1 - 500
      if (dto.weight !== undefined && dto.weight !== null) {
        if (dto.weight < 1 || dto.weight > 500) {
          throw new BadRequestException(`weight must be between 1 and 500 kg`);
        }
      }

      // Height (cm): 30 - 250
      if (dto.height !== undefined && dto.height !== null) {
        if (dto.height < 30 || dto.height > 250) {
          throw new BadRequestException(`height must be between 30 and 250 cm`);
        }
      }

      // BMI: 5 - 80
      if (dto.bmi !== undefined && dto.bmi !== null) {
        if (dto.bmi < 5 || dto.bmi > 80) {
          throw new BadRequestException(`bmi must be between 5 and 80`);
        }
      }

      return await this.encounterRepository.updateEncounter(
        encounter,
        dto,
        manager,
      );
    });
  }

  async startConsultation(
    id: string,
    dto: StartConsultationDto,
  ): Promise<MedicalEncounter> {
    return await this.dataSource.transaction(async (manager) => {
      const encounter = await manager.findOne(MedicalEncounter, {
        where: { encounter_id: id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!encounter) {
        throw new NotFoundException(`Encounter with ID ${id} not found`);
      }

      if (encounter.current_status !== EncounterStatus.REGISTERED) {
        throw new BadRequestException(
          'Only REGISTERED encounters can start consultation',
        );
      }

      encounter.doctor_id = dto.doctor_id;

      encounter.current_status = EncounterStatus.IN_CONSULTATION;

      const savedEncounter = await manager.save(encounter);

      // Ticket queue
      await manager.update(
        QueueTicket,
        { encounter_id: savedEncounter.encounter_id },
        { status: QueueStatus.IN_PROGRESS },
      );

      const fullEncounter = await this.encounterRepository.findDetailById(
        savedEncounter.encounter_id,
        manager,
      );
      if (!fullEncounter) {
        throw new NotFoundException(
          `Encounter with ID ${savedEncounter.encounter_id} not found after update`,
        );
      }
      return fullEncounter;
    });
  }

  async completeConsultation(
    id: string,
    dto: CompleteConsultationDto,
  ): Promise<MedicalEncounter> {
    return await this.dataSource.transaction(async (manager) => {
      const encounter = await manager.findOne(MedicalEncounter, {
        where: { encounter_id: id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!encounter) {
        throw new NotFoundException(`Encounter with ID ${id} not found`);
      }

      if (encounter.current_status !== EncounterStatus.IN_CONSULTATION) {
        throw new BadRequestException(
          'Only IN_CONSULTATION encounters can be completed',
        );
      }

      // Validate ICD code
      if (dto.final_icd_code) {
        const icdExists = await this.icd10Repository.checkIcd10Exists(
          dto.final_icd_code,
          manager,
        );
        if (!icdExists) {
          throw new NotFoundException(
            `ICD code ${dto.final_icd_code} not found`,
          );
        }
      }

      // Update EncounterGateway
      encounter.final_icd_code = dto.final_icd_code;
      encounter.doctor_conclusion = dto.doctor_conclusion;
      encounter.current_status = EncounterStatus.COMPLETED;

      const savedEncounter = await manager.save(encounter);

      // Ticket queue
      await manager.update(
        QueueTicket,
        {
          encounter_id: savedEncounter.encounter_id,
        },
        {
          status: QueueStatus.COMPLETED,
        },
      );

      const fullEncounter = await this.encounterRepository.findDetailById(
        savedEncounter.encounter_id,
        manager,
      );
      if (!fullEncounter) {
        throw new NotFoundException(
          `Encounter with ID ${savedEncounter.encounter_id} not found after update`,
        );
      }
      return fullEncounter;
    });
  }

  async updateStatus(
    id: string,
    status: EncounterStatus,
  ): Promise<MedicalEncounter> {
    return await this.dataSource.transaction(async (manager) => {
      const encounter = await this.encounterRepository.findById(id, manager);

      if (!encounter) {
        throw new NotFoundException(`Encounter with ID ${id} not found`);
      }

      return await this.encounterRepository.updateEncounter(
        encounter,
        { current_status: status },
        manager,
      );
    });
  }

  async getPatientEncounterHistory(patient_id: string) {
    return await this.dataSource.transaction(async (manager) => {
      const patientExists = await this.patientsRepository.findById(
        patient_id,
        manager,
      );
      if (!patientExists) {
        throw new NotFoundException(`Patient with ID ${patient_id} not found`);
      }
      return await this.encounterRepository.getPatientEncounterHistoryById(
        patient_id,
        manager,
      );
    });
  }

  async remove(id: string): Promise<void> {
    return await this.dataSource.transaction(async (manager) => {
      const encounter = await this.encounterRepository.findById(id, manager);
      if (!encounter) {
        throw new NotFoundException(`Encounter with ID ${id} not found`);
      }
      // Soft delete
      await this.encounterRepository.softDelete(encounter, manager);
    });
  }
}
