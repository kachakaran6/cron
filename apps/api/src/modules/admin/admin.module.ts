import { Module, Global } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { FileLoggerService } from '../../common/logger/file-logger.service';

@Global()
@Module({
  controllers: [AdminController],
  providers: [AdminService, FileLoggerService],
  exports: [AdminService, FileLoggerService],
})
export class AdminModule {}
