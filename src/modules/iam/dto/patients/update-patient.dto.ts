import {
  IsOptional,
  IsString,
  IsDateString,
  IsEnum,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from './create-patient.dto';

export class UpdatePatientDto {
  @ApiPropertyOptional({
    example: '012345678901',
    description: 'Số CCCD/CMND của bệnh nhân (tối đa 12 ký tự)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(12)
  cccd?: string;

  @ApiPropertyOptional({
    example: 'Nguyễn Văn B',
    description: 'Họ và tên mới của bệnh nhân',
  })
  @IsOptional()
  @IsString()
  full_name?: string;

  @ApiPropertyOptional({
    example: '1992-05-20',
    description: 'Ngày sinh mới theo định dạng YYYY-MM-DD',
  })
  @IsOptional()
  @IsDateString()
  dob?: string;

  @ApiPropertyOptional({
    example: Gender.NU,
    enum: Gender,
    description: 'Giới tính mới của bệnh nhân',
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({
    example: '0987654321',
    description: 'Số điện thoại liên hệ mới',
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  phone?: string;

  @ApiPropertyOptional({
    example: '456 Trần Hưng Đạo, Quận 5, TP. HCM',
    description: 'Địa chỉ liên hệ mới',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    example: 'Bổ sung: hen phế quản',
    description: 'Cập nhật tiền sử bệnh lý',
  })
  @IsOptional()
  @IsString()
  medical_history?: string;

  @ApiPropertyOptional({
    example: 'Bổ sung: dị ứng hải sản',
    description: 'Cập nhật tiền sử dị ứng',
  })
  @IsOptional()
  @IsString()
  allergy_history?: string;
}
