import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PatientSearchDto {
  @ApiPropertyOptional({
    example: '0912345678',
    description: 'Số điện thoại bệnh nhân cần tìm',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: 'Nguyễn',
    description: 'Họ tên (hoặc một phần) để tìm kiếm gần đúng',
  })
  @IsOptional()
  @IsString()
  full_name?: string;

  @ApiPropertyOptional({
    example: '012345678901',
    description: 'Số CCCD/CMND để tra cứu chính xác',
  })
  @IsOptional()
  @IsString()
  cccd?: string;
}
