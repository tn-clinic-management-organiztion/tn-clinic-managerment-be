import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PatientProfile } from 'src/database/entities/auth/patient_profiles.entity';
import { SysUser } from 'src/database/entities/auth/sys_users.entity';
import { EntityManager, Repository } from 'typeorm';

// SysUser
@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(SysUser)
    private readonly sysUserRepository: Repository<SysUser>,
  ) {}

  async checkExistPhone(
    phone: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const db = manager || this.sysUserRepository.manager;
    const existingPhone = await db.findOne(SysUser, {
      where: { phone: phone },
    });
    return !!existingPhone;
  }

  async checkExistCCCD(
    cccd: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const db = manager || this.sysUserRepository.manager;
    const existingCccd = await db.findOne(SysUser, {
      where: { cccd: cccd },
    });
    return !!existingCccd;
  }

  async createUser(
    phone: string,
    cccd?: string,
    manager?: EntityManager,
  ): Promise<SysUser> {
    const db = manager || this.sysUserRepository.manager;
    const newUser = db.create(SysUser, {
      phone: phone,
      cccd: cccd || null,
    });
    const savedUser = await db.save(newUser);
    return savedUser;
  }

  async updateUser(user_id: string, updateData: Partial<SysUser>, manager?: EntityManager) {
    const db = manager || this.sysUserRepository.manager;
    await db.update(SysUser, { user_id }, updateData);
  }

  async findById(
    user_id: string,
    manager?: EntityManager,
  ): Promise<SysUser | null> {
    const db = manager || this.sysUserRepository.manager;
    return await db.findOne(SysUser, {
      where: { user_id },
    });
  }

  async findByPhone(phone: string, manager?: EntityManager): Promise<SysUser | null> {
    const db = manager || this.sysUserRepository.manager;
    return await db.findOne(SysUser, {
      where: { phone },
      relations: ['patientProfile'],
    });
  }
}
