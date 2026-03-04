import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { PatientProfile } from 'src/database/entities/auth/patient_profiles.entity';
import { StaffProfile } from 'src/database/entities/auth/staff_profiles.entity';
import { SysUser } from 'src/database/entities/auth/sys_users.entity';
import { LoginDto } from 'src/modules/auth/dto/login.dto';
import {
  JwtPayload,
  Tokens,
} from 'src/modules/auth/dto/jwt-payload.interface';
import { hashData, verifyHash } from 'src/utils/hash.util';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(SysUser)
    private usersRepository: Repository<SysUser>,
    @InjectRepository(StaffProfile)
    private staffRepository: Repository<StaffProfile>,
    @InjectRepository(PatientProfile)
    private patientRepository: Repository<PatientProfile>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async getTokens(payload: JwtPayload): Promise<Tokens> {
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRY', '1d'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRY', '7d'),
      }),
    ]);

    return { access_token, refresh_token };
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const hash = await hashData(refreshToken);
    await this.usersRepository.update(userId, {
      refresh_token_hash: hash,
    });
  }

  // ========== CORE AUTH METHODS ==========

  async login(loginDto: LoginDto): Promise<Tokens> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.username = :username', { username: loginDto.username })
      .andWhere('user.is_active = :isActive', { isActive: true })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await verifyHash(
      user.password || '',
      loginDto.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    let payload: JwtPayload = {
      sub: user.user_id,
      username: user.username || '',
      user_type: 'STAFF',
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const staff = await this.staffRepository.query(
      `
  SELECT staff.staff_id, role.role_code, staff_room_schedule.room_id
  FROM staff_profiles staff
  LEFT JOIN sys_roles role ON role.role_id = staff.role_id
  LEFT JOIN staff_room_schedules staff_room_schedule 
    ON staff_room_schedule.staff_id = staff.staff_id
    AND staff_room_schedule.work_date >= $2
    AND staff_room_schedule.work_date < $3
    AND staff_room_schedule.is_active = true
  WHERE staff.staff_id = $1
  `,
      [user.user_id, today, tomorrow],
    );

    if (staff && staff.length > 0) {
      payload = {
        ...payload,
        user_type: 'STAFF',
        role: staff[0].role_code,
        staff_id: staff[0].staff_id,
        assigned_room_id: staff[0].room_id,
      };
    } else {
      // Kiểm tra có phải patient không
      const patient = await this.patientRepository.findOne({
        where: { patient_id: user.user_id },
      });

      if (patient) {
        payload = {
          ...payload,
          user_type: 'PATIENT',
          patient_id: patient.patient_id,
        };
      } else {
        payload.user_type = 'ADMIN';
      }
    }

    const tokens = await this.getTokens(payload);

    // Lưu refresh token hash
    await this.updateRefreshToken(user.user_id, tokens.refresh_token);

    return tokens;
  }

  async refreshTokens(refreshToken: string): Promise<Tokens> {
    try {
      // 1. Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_SECRET'),
      });

      // 2. Tìm user và kiểm tra refresh token hash
      const user = await this.usersRepository.findOne({
        where: { user_id: payload.sub },
        select: ['user_id', 'refresh_token_hash', 'is_active', 'username'],
      });

      if (!user || !user.refresh_token_hash || !user.is_active) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // 3. Verify refresh token hash
      const isValid = await verifyHash(user.refresh_token_hash, refreshToken);

      if (!isValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // 4. Tạo payload mới (có thể cập nhật thông tin)
      let newPayload: JwtPayload = {
        sub: user.user_id,
        user_type: payload.user_type,
      };

      // 5. Lấy thông tin mới nhất
      if (payload.user_type === 'STAFF' && payload.staff_id) {
        const staff = await this.staffRepository
          .createQueryBuilder('staff')
          .leftJoinAndSelect('staff.role', 'role')
          .where('staff.staff_id = :staffId', { staffId: payload.staff_id })
          .getOne();

        if (staff) {
          newPayload = {
            ...newPayload,
            username: user.username ?? '',
            role: staff.role?.role_code,
            staff_id: staff.staff_id,
          };
        }
      } else if (payload.user_type === 'PATIENT' && payload.patient_id) {
        newPayload = {
          ...newPayload,
          patient_id: payload.patient_id,
        };
      }

      // 6. Tạo tokens mới
      const tokens = await this.getTokens(newPayload);

      // 7. Cập nhật refresh token mới
      await this.updateRefreshToken(user.user_id, tokens.refresh_token);

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<boolean> {
    await this.usersRepository.update(userId, {
      refresh_token_hash: null,
    });
    return true;
  }
}
