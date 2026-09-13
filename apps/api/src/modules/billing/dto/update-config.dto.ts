import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateGumroadConfigDto {
  @ApiPropertyOptional({ example: 'your_gumroad_product_id' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({ example: 'https://samast.gumroad.com/l/pro' })
  @IsOptional()
  @IsString()
  productPermalink?: string;

  @ApiPropertyOptional({ example: 'your_webhook_secret' })
  @IsOptional()
  @IsString()
  webhookSecret?: string;
}
