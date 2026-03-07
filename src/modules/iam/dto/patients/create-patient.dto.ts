import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum Gender {
  NAM = 'NAM',
  NU = 'NU',
  KHAC = 'KHAC',
}

export class CreatePatientDto {
  @ApiPropertyOptional({
    example: '012345678901',
    description: 'Số CCCD/CMND của bệnh nhân (tối đa 12 ký tự)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(12)
  cccd?: string;

  @ApiProperty({
    example: 'Nguyễn Văn A',
    description: 'Họ và tên bệnh nhân',
  })
  @IsNotEmpty()
  @IsString()
  full_name: string;

  @ApiProperty({
    example: '1990-01-01',
    description: 'Ngày sinh theo định dạng YYYY-MM-DD',
  })
  @IsNotEmpty()
  @IsDateString()
  dob: string; // Format: YYYY-MM-DD

  @ApiProperty({
    example: Gender.NAM,
    enum: Gender,
    description: 'Giới tính của bệnh nhân',
  })
  @IsNotEmpty()
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({
    example: '0912345678',
    description: 'Số điện thoại liên hệ',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  phone: string;

  @ApiPropertyOptional({
    example: '123 Lê Lợi, Quận 1, TP. HCM',
    description: 'Địa chỉ liên hệ',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    example: 'Tăng huyết áp, tiểu đường type 2',
    description: 'Tiền sử bệnh lý',
  })
  @IsOptional()
  @IsString()
  medical_history?: string;

  @ApiPropertyOptional({
    example: 'Dị ứng penicillin',
    description: 'Tiền sử dị ứng',
  })
  @IsOptional()
  @IsString()
  allergy_history?: string;
}
