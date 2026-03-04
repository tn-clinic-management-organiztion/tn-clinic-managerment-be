import { InjectRepository } from "@nestjs/typeorm";
import { StaffProfile } from "src/database/entities/auth/staff_profiles.entity";
import { Repository } from "typeorm";

export class authRepository { 
  constructor(
    @InjectRepository(StaffProfile)
    private staffRepository: Repository<StaffProfile>,
  ) {}
}