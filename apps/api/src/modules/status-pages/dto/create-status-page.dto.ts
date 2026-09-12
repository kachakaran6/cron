import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';

export interface IncidentDto {
  id: string;
  title: string;
  status: 'INVESTIGATING' | 'IDENTIFIED' | 'MONITORING' | 'RESOLVED';
  startDate: string;
  endDate?: string;
  message?: string;
}

export class CreateStatusPageDto {
  @ApiProperty({ example: 'Production Status', description: 'Title of the status page' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ example: 'acme-status', description: 'Custom public URL slug' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ default: true, description: 'Whether the status page is publicly accessible' })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png', description: 'Custom logo image URL' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ example: ['uuid-job-1', 'uuid-job-2'], description: 'List of cron job IDs monitored on this page' })
  @IsOptional()
  @IsArray()
  monitoredJobIds?: string[];

  @ApiPropertyOptional({ description: 'Incident history log' })
  @IsOptional()
  @IsArray()
  incidents?: IncidentDto[];
}
