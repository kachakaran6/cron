import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { IncidentDto } from './create-status-page.dto';

export class UpdateStatusPageDto {
  @ApiPropertyOptional({ example: 'Production Status' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'acme-status' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ description: 'Whether the status page is publicly accessible' })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ example: ['uuid-job-1', 'uuid-job-2'] })
  @IsOptional()
  @IsArray()
  monitoredJobIds?: string[];

  @ApiPropertyOptional({ description: 'Incident history log' })
  @IsOptional()
  @IsArray()
  incidents?: IncidentDto[];
}
