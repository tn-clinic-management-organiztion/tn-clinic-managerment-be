import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PatientProfile } from 'src/database/entities/auth/patient_profiles.entity';
import { CreatePatientDto } from 'src/modules/iam/dto/patients/create-patient.dto';
import { PatientSearchDto } from 'src/modules/iam/dto/patients/patient-search.dto';
import { EntityManager, Repository } from 'typeorm';

// PatientProfile
@Injectable()
export class PatientsRepository {
  constructor(
    @InjectRepository(PatientProfile)
    private readonly patientProfileRepository: Repository<PatientProfile>,
  ) {}

  async createPatientProfile(
    patient_id: string,
    createPatientDto: CreatePatientDto,
    manager?: EntityManager,
  ): Promise<PatientProfile> {
    const db = manager || this.patientProfileRepository.manager;
    const patientProfile = db.create(PatientProfile, {
      patient_id: patient_id,
      full_name: createPatientDto.full_name,
      dob: new Date(createPatientDto.dob),
      gender: createPatientDto.gender,
      address: createPatientDto.address,
      medical_history: createPatientDto.medical_history,
      allergy_history: createPatientDto.allergy_history,
    });
    const savedProfile = await db.save(patientProfile);
    return savedProfile;
  }

  async updatePatientProfile(
    patient_id: string,
    updateData: Partial<PatientProfile>,
    manager?: EntityManager,
  ) {
    const db = manager || this.patientProfileRepository.manager;
    await db.update(PatientProfile, { patient_id }, updateData);
  }

  async findById(
    patient_id: string,
    manager?: EntityManager,
  ): Promise<PatientProfile | null> {
    const db = manager || this.patientProfileRepository.manager;
    return await db.findOne(PatientProfile, {
      where: { patient_id },
      relations: ['user'],
    });
  }

  async searchPatientProfile(
    searchDto: PatientSearchDto,
    manager?: EntityManager,
  ) {
    const db = manager || this.patientProfileRepository.manager;
    const query = db
      .createQueryBuilder(PatientProfile, 'patient')
      .innerJoinAndSelect('patient.user', 'user')
      .select([
        'patient.patient_id',
        'patient.full_name',
        'patient.dob',
        'patient.gender',
        'patient.medical_history',
        'patient.allergy_history',
        'user.phone',
        'user.cccd',
        'user.created_at',
      ]);
    if (searchDto.phone) {
      query.andWhere('user.phone LIKE :phone', {
        phone: `%${searchDto.phone}%`,
      });
    }

    if (searchDto.full_name) {
      query.andWhere('patient.full_name ILIKE :full_name', {
        full_name: `%${searchDto.full_name}%`,
      });
    }

    if (searchDto.cccd) {
      query.andWhere('user.cccd LIKE :cccd', { cccd: `%${searchDto.cccd}%` });
    }

    // Sắp xếp theo ngày tạo mới nhất
    query.orderBy('user.created_at', 'DESC');

    const patients = await query.getMany();
    return patients.map((patient) => ({
      patient_id: patient.patient_id,
      full_name: patient.full_name,
      dob: patient.dob,
      gender: patient.gender,
      phone: patient.user?.phone,
      cccd: patient.user?.cccd,
      has_cccd: !!patient.user?.cccd,
      medical_history: patient.medical_history,
      allergy_history: patient.allergy_history,
      created_at: patient.user?.created_at,
    }));
  }
}
