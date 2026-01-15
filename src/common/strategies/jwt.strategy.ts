// PassportStrategy: Tích hợp Passport.js vào NestJS
// validate(): Được gọi sau khi JWT được giải mã, trả về user object gắn vào req.user
// Sử dụng createQueryBuilder() để join với role (vì không muốn relation ngược)

import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SysUser } from 'src/database/entities/auth/sys_users.entity';
import { StaffProfile } from 'src/database/entities/auth/staff_profiles.entity';
import { PatientProfile } from 'src/database/entities/auth/patient_profiles.entity';

export type UserType = 'STAFF' | 'PATIENT' | 'ADMIN';

export interface JwtUserInfo {
  user_id: string;
  username?: string | null;
  email?: string | null;
  phone?: string | null;
  user_type?: UserType | null;
  role?: string | null;
  staff_id?: string | null;
  patient_id?: string | null;
  full_name?: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(SysUser)
    private usersRepository: Repository<SysUser>,
    @InjectRepository(StaffProfile)
    private staffRepository: Repository<StaffProfile>,
    @InjectRepository(PatientProfile)
    private patientRepository: Repository<PatientProfile>,
  ) {
    super({
      // Lấy JWT từ header Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: any) {
    // 1. Tìm user trong database
    const user = await this.usersRepository.findOne({
      where: { user_id: payload.sub },
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // 2. Xác định user_type và lấy thêm thông tin
    let userInfo: JwtUserInfo = {
      user_id: user.user_id,
      username: user.username ?? null,
      email: user.email ?? null,
      phone: user.phone ?? null,
    };

    // Kiểm tra là staff hay patient
    const staff = await this.staffRepository
      .createQueryBuilder('staff')
      .leftJoinAndSelect('staff.role', 'role') // Join với role để lấy role_code
      .where('staff.staff_id = :staffId', { staffId: payload.sub })
      .getOne();

    if (staff) {
      userInfo = {
        ...userInfo,
        user_type: 'STAFF',
        role: staff.role?.role_code,
        staff_id: staff.staff_id,
        full_name: staff.full_name,
      };
    } else {
      // Kiểm tra patient
      const patient = await this.patientRepository.findOne({
        where: { patient_id: payload.sub },
      });

      if (patient) {
        userInfo = {
          ...userInfo,
          user_type: 'PATIENT',
          patient_id: patient.patient_id,
          full_name: patient.full_name,
        };
      } else {
        userInfo['user_type'] = 'ADMIN';
      }
    }

    return userInfo;
  }
}
