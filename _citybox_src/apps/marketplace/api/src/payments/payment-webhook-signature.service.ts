import { createHmac, timingSafeEqual } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class PaymentWebhookSignatureService {
  verify(rawBody: string, signatureHeader: string | undefined): void {
    const secret = process.env.PAYMENTS_WEBHOOK_SECRET?.trim();
    if (!secret) {
      throw new UnauthorizedException('Webhook de pagamento não configurado (PAYMENTS_WEBHOOK_SECRET)');
    }
    if (!signatureHeader?.trim()) {
      throw new UnauthorizedException('Assinatura X-Payments-Signature ausente');
    }

    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    const received = signatureHeader.trim();
    if (expected.length !== received.length) {
      throw new UnauthorizedException('Assinatura inválida');
    }
    const ok = timingSafeEqual(Buffer.from(expected), Buffer.from(received));
    if (!ok) throw new UnauthorizedException('Assinatura inválida');
  }
}
