import { StaffProfile } from './../../../database/entities/auth/staff_profiles.entity';
import { SysUser } from './../../../database/entities/auth/sys_users.entity';
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { CreateStaffDto } from 'src/modules/iam/dto/staffs/create-staff.dto';
import { UpdateStaffDto } from 'src/modules/iam/dto/staffs/update-staff.dto';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(SysUser)
    private usersRepository: Repository<SysUser>,
    @InjectRepository(StaffProfile)
    private staffRepository: Repository<StaffProfile>,
  ) {}

  async createStaff(createStaffDto: CreateStaffDto, createdByAdminId?: string) {
    // 1. Kiểm tra username
    const existingUsername = await this.usersRepository.findOne({
      where: { username: createStaffDto.username },
    });
    if (existingUsername) {
      throw new ConflictException('Username already exists');
    }

    // 2. Kiểm tra CCCD nếu có
    if (createStaffDto.cccd) {
      const existingCCCD = await this.usersRepository.findOne({
        where: { cccd: createStaffDto.cccd },
      });
      if (existingCCCD) {
        throw new ConflictException('CCCD already exists');
      }
    }

    // 3. Hash password
    const hashedPassword = await argon2.hash(createStaffDto.password);

    // 4. Tạo user
    const user = this.usersRepository.create({
      username: createStaffDto.username,
      password: hashedPassword,
      email: createStaffDto.email,
      phone: createStaffDto.phone,
      cccd: createStaffDto.cccd || null,
    });

    const savedUser = await this.usersRepository.save(user);

    // 5. Tạo staff profile
    const staffProfile = this.staffRepository.create({
      staff_id: savedUser.user_id,
      full_name: createStaffDto.full_name,
      role_id: createStaffDto.role_id,
      specialty_id: createStaffDto.specialty_id,
      signature_url: createStaffDto.signature_url,
    });

    await this.staffRepository.save(staffProfile);

    return {
      user_id: savedUser.user_id,
      staff_id: savedUser.user_id,
      username: savedUser.username,
      full_name: createStaffDto.full_name,
      email: savedUser.email,
      phone: savedUser.phone,
      cccd: savedUser.cccd,
      role_id: createStaffDto.role_id,
      created_by: createdByAdminId,
    };
  }

  async updateStaff(staffId: string, updateStaffDto: UpdateStaffDto) {
    // 1. Tìm staff
    const staff = await this.staffRepository.findOne({
      where: { staff_id: staffId },
      relations: ['user'],
    });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    // 2. Kiểm tra CCCD nếu có thay đổi
    if (updateStaffDto.cccd && updateStaffDto.cccd !== staff.user.cccd) {
      const existingCCCD = await this.usersRepository.findOne({
        where: { cccd: updateStaffDto.cccd },
      });
      if (existingCCCD) {
        throw new ConflictException('CCCD already exists');
      }
    }

    // 3. Update user nếu có thông tin
    const userUpdates: any = {};
    if (updateStaffDto.email !== undefined)
      userUpdates.email = updateStaffDto.email;
    if (updateStaffDto.phone !== undefined)
      userUpdates.phone = updateStaffDto.phone;
    if (updateStaffDto.cccd !== undefined)
      userUpdates.cccd = updateStaffDto.cccd;

    // Đổi mật khẩu nếu có
    if (updateStaffDto.password) {
      userUpdates.password = await argon2.hash(updateStaffDto.password);
    }

    if (Object.keys(userUpdates).length > 0) {
      await this.usersRepository.update(staffId, userUpdates);
    }

    // 4. Update staff profile
    const staffUpdates: any = {};
    if (updateStaffDto.full_name !== undefined)
      staffUpdates.full_name = updateStaffDto.full_name;
    if (updateStaffDto.role_id !== undefined)
      staffUpdates.role_id = updateStaffDto.role_id;
    if (updateStaffDto.specialty_id !== undefined)
      staffUpdates.specialty_id = updateStaffDto.specialty_id;
    if (updateStaffDto.signature_url !== undefined)
      staffUpdates.signature_url = updateStaffDto.signature_url;

    if (Object.keys(staffUpdates).length > 0) {
      await this.staffRepository.update(staffId, staffUpdates);
    }

    // 5. Lấy thông tin mới nhất
    const updatedStaff = await this.staffRepository.findOne({
      where: { staff_id: staffId },
      relations: ['user', 'role'],
    });

    if (!updatedStaff) {
      throw new NotFoundException('Staff not found');
    }

    return {
      staff_id: updatedStaff.staff_id,
      full_name: updatedStaff.full_name,
      username: updatedStaff.user.username,
      email: updatedStaff.user.email,
      phone: updatedStaff.user.phone,
      cccd: updatedStaff.user.cccd,
      role: updatedStaff.role?.role_code,
      specialty_id: updatedStaff.specialty_id,
    };
  }

  async findAll() {
    const staffs = await this.staffRepository.find({
      relations: ['user', 'role', 'assigned_room', 'specialty'],
    });

    return staffs.map((staff) => ({
      staff_id: staff.staff_id,
      full_name: staff.full_name,
      username: staff.user?.username,
      email: staff.user?.email,
      phone: staff.user?.phone,
      cccd: staff.user?.cccd,
      role: staff.role?.role_code,
      role_name: staff.role?.role_name,
      // Chưa có room
      specialty_id: staff.specialty_id,
      specialty_room: staff.specialty?.specialty_name,
    }));
  }

  async findOne(staffId: string) {
    const staff = await this.staffRepository.findOne({
      where: { staff_id: staffId },
      relations: ['user', 'role', 'assigned_room', 'specialty'],
    });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    const detailStaff = {
      staff_id: staff.staff_id,
      full_name: staff.full_name,
      username: staff.user?.username,
      email: staff.user?.email,
      phone: staff.user?.phone,
      cccd: staff.user?.cccd,
      role: staff.role?.role_code,
      role_name: staff.role?.role_name,
      // Chưa có room
      specialty_id: staff.specialty_id,
      specialty_room: staff.specialty?.specialty_name,
    };

    return detailStaff;
  }
}
