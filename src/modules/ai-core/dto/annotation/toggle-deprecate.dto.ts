import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ToggleDeprecateDto {
  @ApiProperty({ description: 'Set deprecate status' })
  @IsBoolean()
  is_deprecated: boolean;

  @ApiProperty({ description: 'Reason for deprecation', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}