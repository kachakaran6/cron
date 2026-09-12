import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity, ApiQuery } from '@nestjs/swagger';
import { CombinedAuthGuard } from '../../common/guards/combined-auth.guard';
import { CronJobsService } from './cron-jobs.service';
import { CreateCronJobDto } from './dto/create-cron-job.dto';

@ApiTags('Cron Jobs')
@ApiSecurity('dashboard-jwt')
@ApiSecurity('api-key')
@UseGuards(CombinedAuthGuard)
@Controller('jobs')
export class CronJobsController {
  constructor(private readonly cronJobsService: CronJobsService) {}

  @Post()
  @ApiOperation({ summary: 'Create and activate a new cron job' })
  @ApiResponse({ status: 201, description: 'Job created and scheduled successfully' })
  async create(@Req() req: any, @Body() dto: CreateCronJobDto) {
    return this.cronJobsService.createJob(req.organizationId, req.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all cron jobs for the organization' })
  async list(@Req() req: any) {
    return this.cronJobsService.listJobs(req.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details for a specific cron job' })
  async getOne(@Param('id') id: string) {
    return this.cronJobsService.getJobById(id);
  }

  @Get(':id/runs')
  @ApiOperation({ summary: 'Get execution history logs for a specific cron job' })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  async getRuns(@Param('id') id: string, @Query('limit') limit = 50) {
    return this.cronJobsService.getJobRuns(id, Number(limit));
  }

  @Post(':id/execute')
  @ApiOperation({ summary: 'Trigger immediate execution of a job (Run Now)' })
  async executeNow(@Param('id') id: string) {
    return this.cronJobsService.triggerImmediateRun(id);
  }

  @Post(':id/trigger')
  @ApiOperation({ summary: 'Trigger immediate execution alias' })
  async triggerNow(@Param('id') id: string) {
    return this.cronJobsService.triggerImmediateRun(id);
  }
}
