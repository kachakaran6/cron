import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsIn, IsOptional, IsBoolean } from 'class-validator';

export class CreateNotificationChannelDto {
  @ApiProperty({ example: 'DevOps Slack Channel' })
  @IsString()
  name!: string;

  @ApiProperty({ enum: ['email', 'webhook', 'slack', 'discord'], default: 'email' })
  @IsIn(['email', 'webhook', 'slack', 'discord'])
  type!: 'email' | 'webhook' | 'slack' | 'discord';

  @ApiProperty({ example: { url: 'https://hooks.slack.com/services/...' } })
  @IsOptional()
  config?: Record<string, any>;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
