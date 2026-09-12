import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUrl, IsIn, IsOptional, IsInt, IsBoolean, Min, Max } from 'class-validator';

export class UpdateCronJobDto {
  @ApiPropertyOptional({ example: 'Production Database Backup', description: 'Human readable job title' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'https://api.example.com/tasks/backup', description: 'Target URL to call' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  url?: string;

  @ApiPropertyOptional({ enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] })
  @IsOptional()
  @IsIn(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

  @ApiPropertyOptional({ example: '*/5 * * * *', description: 'Standard 5-field cron expression' })
  @IsOptional()
  @IsString()
  schedule?: string;

  @ApiPropertyOptional({ example: 'Asia/Kolkata' })
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

  @ApiPropertyOptional({ description: 'Whether the job is currently enabled' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  // Advanced options from benchmark (cron-job.org)
  @ApiPropertyOptional({ description: 'Save responses in job history' })
  @IsOptional()
  @IsBoolean()
  saveResponses?: boolean;

  @ApiPropertyOptional({ description: 'Treat redirects with HTTP 3xx status code as success' })
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
  @ApiPropertyOptional({ description: 'Notify when execution fails' })
  @IsOptional()
  @IsBoolean()
  notifyOnFailure?: boolean;

  @ApiPropertyOptional({ description: 'Notify after N consecutive failures' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  failureThreshold?: number;

  @ApiPropertyOptional({ description: 'Notify when execution succeeds after it failed before' })
  @IsOptional()
  @IsBoolean()
  notifyOnRecovery?: boolean;

  @ApiPropertyOptional({ description: 'Notify when cronjob will be disabled because of too many failures' })
  @IsOptional()
  @IsBoolean()
  notifyOnDisable?: boolean;

  @ApiPropertyOptional({ description: 'Notify when server TLS certificate is about to expire' })
  @IsOptional()
  @IsBoolean()
  notifyTlsExpiry?: boolean;

  @ApiPropertyOptional({ description: 'Days before TLS expiry to notify' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  tlsExpiryDays?: number;
}
