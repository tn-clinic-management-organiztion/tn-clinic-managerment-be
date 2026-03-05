import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EncounterStatus,
  MedicalEncounter,
} from 'src/database/entities/clinical/medical_encounters.entity';
import { CreateEncounterDto } from 'src/modules/clinical/dto/encounters/create-encounter.dto';
import { QueryEncounterDto } from 'src/modules/clinical/dto/encounters/query-encounter.dto';
import { UpdateEncounterDto } from 'src/modules/clinical/dto/encounters/update-encounter.dto';
import { EntityManager, Repository } from 'typeorm';

// MedicalEncounters
@Injectable()
export class EncountersRepository {
  constructor(
    @InjectRepository(MedicalEncounter)
    private readonly encountersRepository: Repository<MedicalEncounter>,
  ) {}

  async createEncounter(
    dto: CreateEncounterDto,
    manager?: EntityManager,
  ): Promise<MedicalEncounter> {
    const db = manager || this.encountersRepository.manager;
    const encounter = db.create(MedicalEncounter, {
      ...dto,
      current_status: EncounterStatus.REGISTERED,
    });
    return await db.save(encounter);
  }

  async findAllEncounters(
    query: QueryEncounterDto,
    manager?: EntityManager,
  ): Promise<[MedicalEncounter[], number]> {
    const db = manager || this.encountersRepository.manager;
    const {
      page = 1,
      limit = 20,
      search,
      patient_id,
      doctor_id,
      assigned_room_id,
      current_status,
    } = query;
    const skip = (page - 1) * limit;

    const qb = db
      .createQueryBuilder(MedicalEncounter, 'encounter')
      .leftJoinAndSelect('encounter.patient', 'patient')
      .leftJoinAndSelect('encounter.doctor', 'doctor')
      .leftJoinAndSelect('encounter.icd_ref', 'icd');

    if (patient_id) {
      qb.where('encounter.patient_id = :patient_id', { patient_id });
    }

    if (doctor_id) {
      qb.andWhere('encounter.doctor_id = :doctor_id', { doctor_id });
    }

    if (assigned_room_id) {
      qb.andWhere('encounter.assigned_room_id = :assigned_room_id', {
        assigned_room_id,
      });
    }

    if (current_status) {
      qb.andWhere('encounter.current_status = :current_status', {
        current_status,
      });
    }

    if (search) {
      qb.andWhere(
        '(patient.full_name ILIKE :search OR encounter.initial_symptoms ILIKE :search OR encounter.doctor_conclusion ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.orderBy('encounter.visit_date', 'DESC');
    qb.skip(skip).take(limit);

    return await qb.getManyAndCount();
  }

  async checkEncounterExists(id: string, manager?: EntityManager) {
    const db = manager || this.encountersRepository.manager;
    const encounter = await db.exists(MedicalEncounter, { where: { encounter_id: id } });
    return !!encounter;
  }

  async findById(
    id: string,
    manager?: EntityManager,
  ): Promise<MedicalEncounter | null> {
    const db = manager || this.encountersRepository.manager;
    return await db.findOne(MedicalEncounter, {
      where: { encounter_id: id },
    });
  }

  async findDetailById(id: string, manager?: EntityManager) {
    const db = manager || this.encountersRepository.manager;
    const encounter = await db
      .createQueryBuilder(MedicalEncounter, 'e')
      .leftJoin('e.patient', 'p')
      .leftJoin('p.user', 'pu')
      .leftJoin('e.doctor', 'd')
      .leftJoin('e.icd_ref', 'icd')
      .where('e.encounter_id = :id', { id })
      .select([
        // Encounter fields for Doctor UI
        'e.encounter_id',
        'e.visit_date',
        'e.current_status',
        'e.initial_symptoms',
        'e.weight',
        'e.height',
        'e.bmi',
        'e.temperature',
        'e.pulse',
        'e.respiratory_rate',
        'e.bp_systolic',
        'e.bp_diastolic',
        'e.sp_o2',
        'e.final_icd_code',
        'e.doctor_conclusion',
        'e.patient_id',
        'e.doctor_id',

        // Patient fields
        'p.patient_id',
        'p.full_name',
        'p.dob',
        'p.gender',

        // phone from SysUser
        'pu.phone',

        // ICD
        'icd.icd_code',
        'icd.name_vi',
        'icd.name_en',

      ])
      .getOne();
    return encounter;
  }

  async updateEncounter(
    encounter: MedicalEncounter,
    dto: UpdateEncounterDto,
    manager?: EntityManager,
  ) {
    const db = manager || this.encountersRepository.manager;
    Object.assign(encounter, dto);
    return await db.save(encounter);
  }

  async getPatientEncounterHistoryById(
    patient_id: string,
    manager?: EntityManager,
  ) {
    const db = manager || this.encountersRepository.manager;
    const encounters = await db.find(MedicalEncounter, {
      where: { patient_id },
      relations: ['doctor', 'final_icd'],
      order: { visit_date: 'DESC' },
    });

    return encounters;
  }

  async softDelete(encounter: MedicalEncounter, manager?: EntityManager) {
    const db = manager || this.encountersRepository.manager;
    return await db.softRemove(MedicalEncounter, encounter);
  }
}
