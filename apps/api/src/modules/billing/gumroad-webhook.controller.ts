import { Controller, Post, Req, Headers, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BillingService } from './billing.service';

@ApiTags('Billing & Gumroad')
@Controller('webhooks/gumroad')
export class GumroadWebhookController {
  constructor(private readonly billingService: BillingService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ingest inbound Gumroad webhooks' })
  async handleWebhook(
    @Req() req: any,
    @Body() body: any,
    @Headers('x-gumroad-signature') signature?: string,
  ) {
    const rawBody = typeof req.rawBody === 'string' ? req.rawBody : undefined;
    return this.billingService.handleWebhook(body, rawBody, signature);
  }
}
