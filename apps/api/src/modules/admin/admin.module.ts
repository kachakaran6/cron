import { Module, Global } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PlansPricingService } from './plans-pricing.service';
import { FileLoggerService } from '../../common/logger/file-logger.service';

@Global()
@Module({
  controllers: [AdminController],
  providers: [AdminService, PlansPricingService, FileLoggerService],
  exports: [AdminService, PlansPricingService, FileLoggerService],
})
export class AdminModule {}
