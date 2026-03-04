import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from 'src/common/strategies/jwt.strategy';
import { PatientProfile } from 'src/database/entities/auth/patient_profiles.entity';
import { StaffProfile } from 'src/database/entities/auth/staff_profiles.entity';
import { SysUser } from 'src/database/entities/auth/sys_users.entity';
import { AuthController } from 'src/modules/auth/controllers/auth.controller';
import { AuthService } from 'src/modules/auth/services/auth.service';


@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([SysUser, StaffProfile, PatientProfile]),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
