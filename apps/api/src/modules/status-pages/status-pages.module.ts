import { Module } from '@nestjs/common';
import { StatusPagesService } from './status-pages.service';
import { StatusPagesController } from './status-pages.controller';
import { PublicStatusPagesController } from './public-status-pages.controller';

@Module({
  controllers: [StatusPagesController, PublicStatusPagesController],
  providers: [StatusPagesService],
  exports: [StatusPagesService],
})
export class StatusPagesModule {}
