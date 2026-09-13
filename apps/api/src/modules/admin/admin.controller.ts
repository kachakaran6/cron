import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity, ApiQuery } from '@nestjs/swagger';
import { CombinedAuthGuard } from '../../common/guards/combined-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { AdminService, SystemRuntimeConfig } from './admin.service';
import { PlansPricingService, PlansAndPricingSettings } from './plans-pricing.service';

@ApiTags('Admin')
@ApiSecurity('dashboard-jwt')
@UseGuards(CombinedAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly plansPricingService: PlansPricingService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get developer admin system stats and metrics' })
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('logs')
  @ApiOperation({ summary: 'Inspect and search file-based application logs' })
  @ApiQuery({ name: 'level', required: false, example: 'ALL' })
  @ApiQuery({ name: 'search', required: false, example: 'error' })
  @ApiQuery({ name: 'limit', required: false, example: 100 })
  @ApiQuery({ name: 'offset', required: false, example: 0 })
  async getLogs(
    @Query('level') level?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.adminService.getLogs({
      level,
      search,
      limit: limit ? Number(limit) : 100,
      offset: offset ? Number(offset) : 0,
    });
  }

  @Post('logs/clear')
  @ApiOperation({ summary: 'Truncate log files' })
  async clearLogs() {
    return this.adminService.clearLogs();
  }

  @Get('users')
  @ApiOperation({ summary: 'List all registered users and their resource consumption' })
  async getUsers() {
    return this.adminService.getUsers();
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Promote or demote user role (admin / user)' })
  async updateUserRole(@Param('id') id: string, @Body() body: { role: 'admin' | 'user' }) {
    return this.adminService.updateUserRole(id, body.role);
  }

  @Patch('users/:id/plan')
  @ApiOperation({ summary: 'Update user organization plan' })
  async updateUserPlan(@Param('id') id: string, @Body() body: { planId: string }) {
    return this.adminService.updateUserPlan(id, body.planId);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete user and purge all associated resources' })
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Get('config')
  @ApiOperation({ summary: 'Get current system runtime configuration' })
  async getConfig() {
    return this.adminService.getConfig();
  }

  @Patch('config')
  @ApiOperation({ summary: 'Update system runtime configuration' })
  async updateConfig(@Body() body: Partial<SystemRuntimeConfig>) {
    return this.adminService.updateConfig(body);
  }

  @Get('plans-pricing')
  @ApiOperation({ summary: 'Get current plans, feature toggles, quotas and pricing configuration' })
  async getPlansPricing() {
    return this.plansPricingService.getSettings();
  }

  @Put('plans-pricing')
  @ApiOperation({ summary: 'Update plans, feature toggles, quotas and pricing configuration' })
  async updatePlansPricing(@Body() body: Partial<PlansAndPricingSettings>, @Req() req: any) {
    const adminId = req?.userId || req?.user?.id || 'admin';
    const settings = await this.plansPricingService.updateSettings(body, adminId);
    return {
      success: true,
      settings,
      message: 'Plans and pricing settings updated successfully',
    };
  }

  @Post('plans-pricing/reset')
  @ApiOperation({ summary: 'Reset plans, feature toggles, quotas and pricing to defaults' })
  async resetPlansPricing(@Req() req: any) {
    const adminId = req?.userId || req?.user?.id || 'admin';
    const settings = await this.plansPricingService.resetToDefaults(adminId);
    return {
      success: true,
      settings,
      message: 'Plans and pricing reset to system factory defaults',
    };
  }
}
