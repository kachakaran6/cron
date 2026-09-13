import { Controller, Get, Post, Body, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { CombinedAuthGuard } from '../../common/guards/combined-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { BillingService } from './billing.service';
import { VerifyLicenseDto } from './dto/verify-license.dto';
import { UpdateGumroadConfigDto } from './dto/update-config.dto';

@ApiTags('Billing & Gumroad')
@Controller()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // ── Public Pricing Tiers ───────────────────────────────────────────────────

  @Get('gumroad/tiers')
  @ApiOperation({ summary: 'Get public pricing tiers and checkout URLs' })
  async getTiers(@Query('email') email?: string) {
    return this.billingService.getTiers(email);
  }

  // ── Authenticated User Subscription ────────────────────────────────────────

  @Get('user/subscription')
  @ApiSecurity('dashboard-jwt')
  @UseGuards(CombinedAuthGuard)
  @ApiOperation({ summary: 'Get current user subscription state and plan' })
  async getSubscription(@Req() req: any) {
    return this.billingService.getUserSubscription(req.userId, req.organizationId);
  }

  @Post('user/subscription/verify-license')
  @ApiSecurity('dashboard-jwt')
  @UseGuards(CombinedAuthGuard)
  @ApiOperation({ summary: 'Verify Gumroad license key and activate Pro tier' })
  async verifyLicense(@Req() req: any, @Body() dto: VerifyLicenseDto) {
    return this.billingService.verifyAndActivateLicense(req.userId, req.organizationId, dto.licenseKey);
  }

  @Post('user/subscription/sync')
  @ApiSecurity('dashboard-jwt')
  @UseGuards(CombinedAuthGuard)
  @ApiOperation({ summary: 'Re-sync current subscription with Gumroad API' })
  async syncSubscription(@Req() req: any) {
    return this.billingService.syncSubscription(req.userId, req.organizationId);
  }

  // ── Admin Gumroad Management ───────────────────────────────────────────────

  @Get('admin/gumroad')
  @ApiSecurity('dashboard-jwt')
  @UseGuards(CombinedAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Get Gumroad admin metrics, audit logs, and settings' })
  async getAdminData() {
    return this.billingService.getAdminData();
  }

  @Post('admin/gumroad/config')
  @ApiSecurity('dashboard-jwt')
  @UseGuards(CombinedAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Update Gumroad configuration dynamically' })
  async updateConfig(@Body() dto: UpdateGumroadConfigDto) {
    return this.billingService.updateConfig(dto);
  }
}
