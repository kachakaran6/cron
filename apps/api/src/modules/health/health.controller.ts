import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Check API Liveness & Readiness Probes' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'cron-api',
    };
  }
}
