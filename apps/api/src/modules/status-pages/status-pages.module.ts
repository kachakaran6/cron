import { Module } from '@nestjs/common';
import { StatusPagesService } from './status-pages.service';
import { StatusPagesController } from './status-pages.controller';
import { PublicStatusPagesController } from './public-status-pages.controller';
import { EntitlementsModule } from '../entitlements/entitlements.module';

@Module({
  imports: [EntitlementsModule],
  controllers: [StatusPagesController, PublicStatusPagesController],
  providers: [StatusPagesService],
  exports: [StatusPagesService],
})
export class StatusPagesModule {}
