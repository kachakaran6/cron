import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyLicenseDto {
  @ApiProperty({
    example: 'XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX',
    description: 'Gumroad product license key from purchase receipt',
  })
  @IsString()
  @IsNotEmpty()
  licenseKey!: string;
}
