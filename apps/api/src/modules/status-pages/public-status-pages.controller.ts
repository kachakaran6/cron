import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StatusPagesService } from './status-pages.service';

@ApiTags('Public Status Pages')
@Controller('public/status')
export class PublicStatusPagesController {
  constructor(private readonly statusPagesService: StatusPagesService) {}

  @Get(':slug')
  @ApiOperation({ summary: 'Get public status page by slug' })
  async getPublic(@Param('slug') slug: string) {
    return this.statusPagesService.getPublicBySlug(slug);
  }
}
