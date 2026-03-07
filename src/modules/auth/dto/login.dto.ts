import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'doctor01',
    description: 'Tên đăng nhập của user trong hệ thống',
  })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({
    example: 'P@ssw0rd!',
    description: 'Mật khẩu đăng nhập',
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}
