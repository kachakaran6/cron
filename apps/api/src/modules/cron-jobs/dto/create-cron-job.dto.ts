import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUrl, IsIn, IsOptional, IsInt, IsBoolean, Min, Max } from 'class-validator';

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

  @ApiPropertyOptional({ default: true, description: 'Whether the job is currently enabled' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ example: 3, default: 3, description: 'Number of automatic retries on failure' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  retryCount?: number;

  @ApiPropertyOptional({ example: 5000, default: 5000, description: 'Delay between retries in ms' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(300000)
  retryDelayMs?: number;

  // Advanced options from benchmark (cron-job.org)
  @ApiPropertyOptional({ default: true, description: 'Save responses in job history' })
  @IsOptional()
  @IsBoolean()
  saveResponses?: boolean;

  @ApiPropertyOptional({ default: true, description: 'Treat redirects with HTTP 3xx status code as success' })
  @IsOptional()
  @IsBoolean()
  redirectSuccess?: boolean;

  @ApiPropertyOptional({ example: 'admin', description: 'HTTP Basic Auth Username' })
  @IsOptional()
  @IsString()
  authUsername?: string;

  @ApiPropertyOptional({ example: 'password123', description: 'HTTP Basic Auth Password' })
  @IsOptional()
  @IsString()
  authPassword?: string;

  // Notification & alerting rules
  @ApiPropertyOptional({ default: true, description: 'Notify when execution fails' })
  @IsOptional()
  @IsBoolean()
  notifyOnFailure?: boolean;

  @ApiPropertyOptional({ default: 1, description: 'Notify after N consecutive failures' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  failureThreshold?: number;

  @ApiPropertyOptional({ default: true, description: 'Notify when execution succeeds after it failed before' })
  @IsOptional()
  @IsBoolean()
  notifyOnRecovery?: boolean;

  @ApiPropertyOptional({ default: true, description: 'Notify when cronjob will be disabled because of too many failures' })
  @IsOptional()
  @IsBoolean()
  notifyOnDisable?: boolean;

  @ApiPropertyOptional({ default: false, description: 'Notify when server TLS certificate is about to expire' })
  @IsOptional()
  @IsBoolean()
  notifyTlsExpiry?: boolean;

  @ApiPropertyOptional({ default: 30, description: 'Days before TLS expiry to notify' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  tlsExpiryDays?: number;
}
