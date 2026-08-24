import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  RawBodyRequest,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectService } from '../common/inject.js';
import { ApiExcludeController, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  OrderPaymentSyncService,
  type InternalPaymentWebhookPayload,
} from './order-payment-sync.service.js';
import { PaymentWebhookSignatureService } from './payment-webhook-signature.service.js';

@ApiTags('internal')
@ApiExcludeController()
@Controller('v1/internal/payments')
export class PaymentWebhookController {
  constructor(
    @InjectService(OrderPaymentSyncService) private readonly sync: OrderPaymentSyncService,
    @InjectService(PaymentWebhookSignatureService) private readonly signatures: PaymentWebhookSignatureService,
  ) {}

  @Post('webhooks')
  @HttpCode(200)
  async receiveWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Body() body: InternalPaymentWebhookPayload,
    @Headers('x-payments-signature') signature?: string,
    @Headers('x-payments-event') eventType?: string,
  ) {
    const rawBody = req.rawBody?.toString('utf8');
    if (!rawBody) {
      throw new UnauthorizedException('Corpo bruto ausente — habilite rawBody no bootstrap');
    }
    this.signatures.verify(rawBody, signature);

    const resolvedEvent = body.event?.trim() || eventType?.trim();
    if (!resolvedEvent) {
      throw new UnauthorizedException('Campo event ausente no payload assinado');
    }
    return this.sync.handleInternalWebhook(resolvedEvent, body);
  }
}
