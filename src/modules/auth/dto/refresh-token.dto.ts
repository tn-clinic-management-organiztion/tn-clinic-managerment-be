import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh-token-demo',
    description: 'Refresh token hợp lệ được trả về từ API đăng nhập',
  })
  @IsNotEmpty()
  @IsString()
  refresh_token: string;
}
