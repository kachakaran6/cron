import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { CombinedAuthGuard } from '../../common/guards/combined-auth.guard';
import { NotificationsService } from './notifications.service';
import { CreateNotificationChannelDto } from './dto/create-notification-channel.dto';

@ApiTags('Notification Channels')
@ApiSecurity('dashboard-jwt')
@ApiSecurity('api-key')
@UseGuards(CombinedAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List all notification channels' })
  async list(@Req() req: any) {
    return this.notificationsService.list(req.organizationId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new notification channel' })
  async create(@Req() req: any, @Body() dto: CreateNotificationChannelDto) {
    return this.notificationsService.create(req.organizationId, dto);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Toggle notification channel state' })
  async toggle(@Req() req: any, @Param('id') id: string, @Body('enabled') enabled: boolean) {
    return this.notificationsService.toggle(id, req.organizationId, enabled);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification channel' })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.notificationsService.delete(id, req.organizationId);
  }
}
