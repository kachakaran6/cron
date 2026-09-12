import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Dev Admin' })
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: 'admin@samast.pro' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SuperSecret123', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}

export class LoginDto {
  @ApiProperty({ example: 'admin@samast.pro' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SuperSecret123' })
  @IsString()
  @MinLength(1)
  password: string;
}
