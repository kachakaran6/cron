import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUrl, IsIn, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateCronJobDto {
  @ApiProperty({ example: 'Production Database Backup', description: 'Human readable job title' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'https://api.example.com/tasks/backup', description: 'Target URL to call' })
  @IsUrl({ require_tld: false })
  url!: string;

  @ApiProperty({ enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'], default: 'GET' })
  @IsIn(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])
  method!: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

  @ApiProperty({ example: '*/5 * * * *', description: 'Standard 5-field cron expression' })
  @IsString()
  schedule!: string;

  @ApiPropertyOptional({ example: 'Asia/Kolkata', default: 'UTC' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ example: { Authorization: 'Bearer secret_token' } })
  @IsOptional()
  headers?: Record<string, string>;

  @ApiPropertyOptional({ example: '{"type":"full"}' })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ example: 10000, description: 'Timeout in ms (max 60000)' })
  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(60000)
  timeoutMs?: number;
}
