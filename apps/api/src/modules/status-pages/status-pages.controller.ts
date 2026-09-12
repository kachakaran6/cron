import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { CombinedAuthGuard } from '../../common/guards/combined-auth.guard';
import { StatusPagesService } from './status-pages.service';
import { CreateStatusPageDto } from './dto/create-status-page.dto';
import { UpdateStatusPageDto } from './dto/update-status-page.dto';

@ApiTags('Status Pages')
@ApiSecurity('dashboard-jwt')
@ApiSecurity('api-key')
@UseGuards(CombinedAuthGuard)
@Controller('status-pages')
export class StatusPagesController {
  constructor(private readonly statusPagesService: StatusPagesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new status page' })
  async create(@Req() req: any, @Body() dto: CreateStatusPageDto) {
    return this.statusPagesService.create(req.organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all status pages for the organization' })
  async list(@Req() req: any) {
    return this.statusPagesService.list(req.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get status page details by ID' })
  async getOne(@Req() req: any, @Param('id') id: string) {
    return this.statusPagesService.getOne(id, req.organizationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing status page' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateStatusPageDto) {
    return this.statusPagesService.update(id, req.organizationId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a status page' })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.statusPagesService.delete(id, req.organizationId);
  }
}
