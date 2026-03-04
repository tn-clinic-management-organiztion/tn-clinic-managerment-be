import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StaffProfile } from 'src/database/entities/auth/staff_profiles.entity';
import { EntityManager, IsNull, Repository } from 'typeorm';

@Injectable()
export class StaffsRepository {
  constructor(
    @InjectRepository(StaffProfile)
    private readonly staffsRepository: Repository<StaffProfile>) {}

  async findById(staff_id: string, manager?: EntityManager) {
    const db = manager || this.staffsRepository.manager;
    return await db.findOne(StaffProfile, {
      where: { staff_id, deleted_at: IsNull() },
      relations: ['user'],
    });
  }
}
