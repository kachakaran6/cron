import { Module } from '@nestjs/common';
import { CronJobsController } from './cron-jobs.controller';
import { CronJobsService } from './cron-jobs.service';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [EntitlementsModule, NotificationsModule],
  controllers: [CronJobsController],
  providers: [CronJobsService],
  exports: [CronJobsService],
})
export class CronJobsModule {}
