import { Module } from '@nestjs/common';
import { CronJobsModule } from './modules/cron-jobs/cron-jobs.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { EntitlementsModule } from './modules/entitlements/entitlements.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    CronJobsModule,
    ApiKeysModule,
    EntitlementsModule,
    HealthModule,
  ],
})
export class AppModule {}
