import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { MedicalEncounter } from '../../../database/entities/clinical/medical_encounters.entity';
import {
  CreateEncounterDto,
  UpdateEncounterDto,
  QueryEncounterDto,
  StartConsultationDto,
  CompleteConsultationDto,
  EncounterStatus,
} from './dto/encounter.dto';
import {
  QueueStatus,
  QueueTicket,
} from 'src/database/entities/reception/queue_tickets.entity';

@Injectable()
export class EncountersService {
  constructor(
    @InjectRepository(MedicalEncounter)
    private readonly encounterRepo: Repository<MedicalEncounter>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateEncounterDto): Promise<MedicalEncounter> {
    // Validate patient_id exists
    const patientExists = await this.dataSource.manager
      .createQueryBuilder()
      .select('1')
      .from('patient_profiles', 'p')
      .where('p.patient_id = :id', { id: dto.patient_id })
      .andWhere('p.deleted_at IS NULL')
      .getRawOne();

    if (!patientExists) {
      throw new NotFoundException(
        `Patient with ID ${dto.patient_id} not found`,
      );
    }

    // Validate doctor_id if provided
    if (dto.doctor_id) {
      const doctorExists = await this.dataSource.manager
        .createQueryBuilder()
        .select('1')
        .from('staff_profiles', 's')
        .where('s.staff_id = :id', { id: dto.doctor_id })
        .andWhere('s.deleted_at IS NULL')
        .getRawOne();

      if (!doctorExists) {
        throw new NotFoundException(
          `Doctor with ID ${dto.doctor_id} not found`,
        );
      }
    }

    // Validate room_id if provided
    if (dto.assigned_room_id) {
      const roomExists = await this.dataSource.manager
        .createQueryBuilder()
        .select('1')
        .from('org_rooms', 'r')
        .where('r.room_id = :id', { id: dto.assigned_room_id })
        .andWhere('r.is_active = true')
        .getRawOne();

      if (!roomExists) {
        throw new NotFoundException(
          `Room with ID ${dto.assigned_room_id} not found`,
        );
      }
    }

    const encounter = this.encounterRepo.create({
      ...dto,
      current_status: EncounterStatus.REGISTERED,
    });

    return await this.encounterRepo.save(encounter);
  }

  async findAll(query: QueryEncounterDto) {
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

    const qb = this.encounterRepo
      .createQueryBuilder('encounter')
      .leftJoinAndSelect('encounter.patient', 'patient')
      .leftJoinAndSelect('encounter.doctor', 'doctor')
      .leftJoinAndSelect('encounter.assigned_room', 'room')
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

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
  const encounter = await this.encounterRepo
    .createQueryBuilder("e")
    .leftJoin("e.patient", "p")
    .leftJoin("p.user", "pu") // lấy phone từ sys_users
    .leftJoin("e.doctor", "d")
    .leftJoin("e.assigned_room", "r")
    .leftJoin("e.icd_ref", "icd")
    .where("e.encounter_id = :id", { id })
    .select([
      // Encounter fields cần cho Doctor UI
      "e.encounter_id",
      "e.visit_date",
      "e.current_status",
      "e.initial_symptoms",
      "e.weight",
      "e.height",
      "e.bmi",
      "e.temperature",
      "e.pulse",
      "e.respiratory_rate",
      "e.bp_systolic",
      "e.bp_diastolic",
      "e.sp_o2",
      "e.final_icd_code",
      "e.doctor_conclusion",
      "e.assigned_room_id",
      "e.patient_id",
      "e.doctor_id",

      // Patient fields cần hiển thị
      "p.patient_id",
      "p.full_name",
      "p.dob",
      "p.gender",

      // chỉ lấy phone từ SysUser
      "pu.phone",

      // ICD hiển thị dropdown đã chọn
      "icd.icd_code",
      "icd.name_vi",
      "icd.name_en",

      // phòng (nếu bạn cần)
      "r.room_id",
      "r.room_name",
    ])
    .getOne();

  if (!encounter) {
    throw new NotFoundException(`Encounter with ID ${id} not found`);
  }
  const patient_phone = (encounter as any)?.patient?.user?.phone ?? null;
  delete (encounter as any)?.patient?.user;
  return {
    ...encounter,
    patient_phone,
  };
}

  async update(id: string, dto: UpdateEncounterDto): Promise<MedicalEncounter> {
    const encounter = await this.encounterRepo.findOne({
      where: { encounter_id: id },
    });

    if (!encounter) {
      throw new NotFoundException(`Encounter with ID ${id} not found`);
    }

    // Validate ICD code if provided
    if (dto.final_icd_code) {
      const icdExists = await this.dataSource.manager
        .createQueryBuilder()
        .select('1')
        .from('ref_icd10', 'icd')
        .where('icd.icd_code = :code', { code: dto.final_icd_code })
        .getRawOne();

      if (!icdExists) {
        throw new NotFoundException(`ICD code ${dto.final_icd_code} not found`);
      }
    }

    Object.assign(encounter, dto);
    return await this.encounterRepo.save(encounter);
  }

  async startConsultation(
    id: string,
    dto: StartConsultationDto,
  ): Promise<MedicalEncounter> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();

    try {
      const encounter = await queryRunner.manager.findOne(MedicalEncounter, {
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

      if (dto.assigned_room_id) {
        encounter.assigned_room_id = dto.assigned_room_id;
      }
      encounter.current_status = EncounterStatus.IN_CONSULTATION;

      const savedEncounter = await queryRunner.manager.save(encounter);

      // Ticket queue
      await queryRunner.manager.update(
        QueueTicket,
        { encounter_id: savedEncounter.encounter_id },
        { status: QueueStatus.IN_PROGRESS },
      );

      await queryRunner.commitTransaction();

      const fullEncounter = await this.findOne(savedEncounter.encounter_id);

      return fullEncounter;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async completeConsultation(
    id: string,
    dto: CompleteConsultationDto,
  ): Promise<MedicalEncounter> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();

    try {
      const encounter = await queryRunner.manager.findOne(MedicalEncounter, {
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

      const icdExists = await queryRunner.manager
        .createQueryBuilder()
        .select('1')
        .from('ref_icd10', 'icd')
        .where('icd.icd_code = :code', { code: dto.final_icd_code })
        .limit(1)
        .getRawOne();

      if (!icdExists) {
        throw new NotFoundException(`ICD code ${dto.final_icd_code} not found`);
      }

      // Update EncounterGateway
      encounter.final_icd_code = dto.final_icd_code;
      encounter.doctor_conclusion = dto.doctor_conclusion;
      encounter.current_status = EncounterStatus.COMPLETED;

      const savedEncounter = await queryRunner.manager.save(encounter);

      // Ticket queue
      await queryRunner.manager.update(
        QueueTicket,
        {
          encounter_id: savedEncounter.encounter_id,
        },
        {
          status: QueueStatus.COMPLETED,
        },
      );

      await queryRunner.commitTransaction();

      const fullEncounter = await this.findOne(savedEncounter.encounter_id);

      return fullEncounter;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateStatus(
    id: string,
    status: EncounterStatus,
  ): Promise<MedicalEncounter> {
    const encounter = await this.encounterRepo.findOne({
      where: { encounter_id: id },
    });

    if (!encounter) {
      throw new NotFoundException(`Encounter with ID ${id} not found`);
    }

    encounter.current_status = status;
    return await this.encounterRepo.save(encounter);
  }

  async getPatientEncounterHistory(patientId: string) {
    const encounters = await this.encounterRepo.find({
      where: { patient_id: patientId },
      relations: ['doctor', 'assigned_room', 'final_icd'],
      order: { visit_date: 'DESC' },
    });

    return encounters;
  }

  async remove(id: string): Promise<void> {
    const encounter = await this.encounterRepo.findOne({
      where: { encounter_id: id },
    });

    if (!encounter) {
      throw new NotFoundException(`Encounter with ID ${id} not found`);
    }

    // Soft delete
    encounter.deleted_at = new Date();
    await this.encounterRepo.save(encounter);
  }
}
