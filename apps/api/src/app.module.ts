import { Module } from '@nestjs/common';
import { CronJobsModule } from './modules/cron-jobs/cron-jobs.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { EntitlementsModule } from './modules/entitlements/entitlements.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { StatusPagesModule } from './modules/status-pages/status-pages.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    AuthModule,
    AdminModule,
    CronJobsModule,
    ApiKeysModule,
    EntitlementsModule,
    HealthModule,
    StatusPagesModule,
    NotificationsModule,
  ],
})
export class AppModule {}
