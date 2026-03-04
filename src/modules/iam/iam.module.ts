import { UsersRepository } from './repositories/users.repository';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SysUser } from 'src/database/entities/auth/sys_users.entity';
import { PatientProfile } from 'src/database/entities/auth/patient_profiles.entity';
import { PatientsController } from 'src/modules/iam/controllers/patients.controller';
import { PatientsService } from 'src/modules/iam/services/patients.service';
import { StaffController } from 'src/modules/iam/controllers/staffs.controller';
import { StaffService } from 'src/modules/iam/services/staff.service';
import { StaffProfile } from 'src/database/entities/auth/staff_profiles.entity';
import { PatientsRepository } from 'src/modules/iam/repositories/patients.repository';
import { StaffsRepository } from 'src/modules/iam/repositories/staffs.repository';

@Module({
  imports: [TypeOrmModule.forFeature([SysUser, StaffProfile, PatientProfile])],
  controllers: [PatientsController, StaffController],
  providers: [
    PatientsService,
    StaffService,
    UsersRepository,
    PatientsRepository,
    StaffsRepository,
  ],
  exports: [
    PatientsService,
    StaffService,
    UsersRepository,
    PatientsRepository,
    StaffsRepository,
  ],
})
export class IamModule {}
