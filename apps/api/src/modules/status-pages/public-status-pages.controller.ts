import { Controller, Get, Param, Res } from '@nestjs/common';
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

  @Get('badge/:id.svg')
  @ApiOperation({ summary: 'Get SVG status badge for markdown embedding' })
  async getBadgeSvg(@Param('id') id: string, @Res() res: any) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="20" role="img" aria-label="cron: operational">
      <linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
      <clipPath id="r"><rect width="120" height="20" rx="3" fill="#fff"/></clipPath>
      <g clip-path="url(#r)">
        <rect width="45" height="20" fill="#555"/>
        <rect x="45" width="75" height="20" fill="#10b981"/>
        <rect width="120" height="20" fill="url(#s)"/>
      </g>
      <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
        <text x="235" y="140" transform="scale(.1)" fill="#fff" textLength="350">cron</text>
        <text x="825" y="140" transform="scale(.1)" fill="#fff" textLength="650">operational</text>
      </g>
    </svg>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'max-age=60');
    return res.send(svg);
  }
}
