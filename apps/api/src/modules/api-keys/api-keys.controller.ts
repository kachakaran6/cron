import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { CombinedAuthGuard } from '../../common/guards/combined-auth.guard';
import { ApiKeysService } from './api-keys.service';

@ApiTags('API Keys')
@ApiSecurity('dashboard-jwt')
@UseGuards(CombinedAuthGuard)
@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @ApiOperation({ summary: 'Generate a new API key' })
  async create(@Req() req: any, @Body('name') name: string) {
    return this.apiKeysService.createApiKey(req.organizationId, req.userId, name || 'New API Key');
  }

  @Get()
  @ApiOperation({ summary: 'List all active API keys' })
  async list(@Req() req: any) {
    return this.apiKeysService.listApiKeys(req.organizationId, req.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoke an API key' })
  async revoke(@Req() req: any, @Param('id') id: string) {
    return this.apiKeysService.revokeApiKey(id, req.organizationId, req.userId);
  }
}
