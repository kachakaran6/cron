import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { GumroadWebhookController } from './gumroad-webhook.controller';
import { EntitlementsModule } from '../entitlements/entitlements.module';

@Module({
  imports: [EntitlementsModule],
  controllers: [BillingController, GumroadWebhookController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
