import { PatientProfile } from './../../../database/entities/auth/patient_profiles.entity';
import { SysUser } from 'src/database/entities/auth/sys_users.entity';
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { CreatePatientDto } from 'src/modules/iam/dto/patients/create-patient.dto';
import { UpdatePatientDto } from 'src/modules/iam/dto/patients/update-patient.dto';
import { PatientSearchDto } from 'src/modules/iam/dto/patients/patient-search.dto';
import { UsersRepository } from 'src/modules/iam/repositories/users.repository';
import { PatientsRepository } from 'src/modules/iam/repositories/patients.repository';

@Injectable()
export class PatientsService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly patientsRepository: PatientsRepository,
    private readonly dataSource: DataSource,
  ) {}

  async create(createPatientDto: CreatePatientDto, manager?: EntityManager) {
    const execute = async (mgr: EntityManager) => {
      //check exist phone, cccd
      if (createPatientDto.phone) {
        const existingPhone = await this.usersRepository.checkExistPhone(
          createPatientDto.phone,
          mgr,
        );
        if (existingPhone) {
          throw new ConflictException(
            'Số điện thoại đã được đăng ký cho bệnh nhân khác',
          );
        }
      }

      if (createPatientDto.cccd) {
        const existingCCCD = await this.usersRepository.checkExistCCCD(
          createPatientDto.cccd,
          mgr,
        );
        if (existingCCCD) {
          throw new ConflictException('CCCD đã tồn tại trong hệ thống');
        }
      }

      // Create user
      const user = await this.usersRepository.createUser(
        createPatientDto.phone,
        createPatientDto.cccd || undefined,
        mgr,
      );

      // Create patient profile (cũng dùng manager)
      const patientProfile = await this.patientsRepository.createPatientProfile(
        user.user_id,
        createPatientDto,
        mgr,
      );

      return {
        success: true,
        patient_id: user.user_id,
        full_name: createPatientDto.full_name,
        phone: user.phone,
        cccd: user.cccd,
        has_cccd: !!user.cccd,
        message: user.cccd
          ? 'Tạo hồ sơ bệnh nhân với CCCD thành công'
          : 'Tạo hồ sơ bệnh nhân không có CCCD thành công',
        created_at: new Date(),
      };
    };
    if (manager) {
      return await execute(manager);
    } else {
      return await this.dataSource.transaction(async (newManager) => {
        return await execute(newManager);
      });
    }
  }

  async update(
    patientId: string,
    updatePatientDto: UpdatePatientDto,
    manager?: EntityManager,
  ) {
    const execute = async (mgr: EntityManager) => {
      // find patient (user & patient profile)
      const user = await this.usersRepository.findById(patientId, mgr);
      const patient = await this.patientsRepository.findById(patientId, mgr);

      if (!user) {
        throw new NotFoundException('Không tìm thấy bệnh nhân');
      }

      // if phone number is being updated
      if (updatePatientDto.phone && updatePatientDto.phone !== user?.phone) {
        const existingPhone = await this.usersRepository.checkExistPhone(
          updatePatientDto.phone,
          mgr,
        );
        if (existingPhone) {
          throw new ConflictException('Số điện thoại đã được sử dụng');
        }
      }

      // if CCCD is being updated
      if (updatePatientDto.cccd && updatePatientDto.cccd !== user?.cccd) {
        const existingCCCD = await this.usersRepository.checkExistCCCD(
          updatePatientDto.cccd,
          mgr,
        );
        if (existingCCCD) {
          throw new ConflictException('CCCD đã tồn tại trong hệ thống');
        }
      }

      // 4. update user info if needed
      const userUpdates: any = {};
      if (updatePatientDto.phone !== undefined)
        userUpdates.phone = updatePatientDto.phone;
      if (updatePatientDto.cccd !== undefined)
        userUpdates.cccd = updatePatientDto.cccd;

      if (Object.keys(userUpdates).length > 0) {
        await this.usersRepository.updateUser(patientId, userUpdates, mgr);
      }

      // update patient profile info if needed
      const patientUpdates: any = {};
      if (updatePatientDto.full_name !== undefined)
        patientUpdates.full_name = updatePatientDto.full_name;
      if (updatePatientDto.dob !== undefined)
        patientUpdates.dob = new Date(updatePatientDto.dob);
      if (updatePatientDto.gender !== undefined)
        patientUpdates.gender = updatePatientDto.gender;
      if (updatePatientDto.address !== undefined)
        patientUpdates.address = updatePatientDto.address;
      if (updatePatientDto.medical_history !== undefined)
        patientUpdates.medical_history = updatePatientDto.medical_history;
      if (updatePatientDto.allergy_history !== undefined)
        patientUpdates.allergy_history = updatePatientDto.allergy_history;

      if (Object.keys(patientUpdates).length > 0) {
        await this.patientsRepository.updatePatientProfile(
          patientId,
          patientUpdates,
          mgr
        );
      }

      // 6. Lấy thông tin mới nhất
      const updatedPatient = await this.patientsRepository.findById(
        patientId,
        mgr,
      );

      if (!updatedPatient) {
        throw new NotFoundException('Patient not found');
      }

      return {
        success: true,
        patient_id: updatedPatient.patient_id,
        full_name: updatedPatient.full_name,
        phone: updatedPatient.user?.phone,
        cccd: updatedPatient.user?.cccd,
        dob: updatedPatient.dob,
        gender: updatedPatient.gender,
        updated_at: new Date(),
      };
    };

    if(manager) {
      return await execute(manager);
    } else {
      return await this.dataSource.transaction(async (newManager) => {
        return await execute(newManager);
      });
    }
  }

  async search(searchDto: PatientSearchDto) {
    return await this.dataSource.transaction(async (manager) => {
      return await this.patientsRepository.searchPatientProfile(
        searchDto,
        manager,
      );
    });
  }

  async getById(patientId: string) {
    return await this.dataSource.transaction(async (manager) => {
      const patient = await this.patientsRepository.findById(patientId, manager);
      if (!patient) {
        throw new NotFoundException('Không tìm thấy bệnh nhân');
      }

      return patient;
    });
  }

  async getByPhone(phone: string) {
    await this.dataSource.transaction(async (manager) => {
      const user = await this.usersRepository.findByPhone(phone, manager);

      if (!user || !user.patientProfile) {
        throw new NotFoundException(
          'Không tìm thấy bệnh nhân với số điện thoại này',
        );
      }

      return user.patientProfile;
    });
  }

  async linkToAccount(patientId: string, username: string, password: string) {
    // Logic liên kết patient với tài khoản (khi patient đăng ký trên web)
    // ... (đã triển khai trong phiên bản trước)
  }
}
