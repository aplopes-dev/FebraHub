import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { PaymentAuthContext } from './auth.types.js';

export const PaymentAuth = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PaymentAuthContext => {
    const request = ctx.switchToHttp().getRequest<{ paymentAuth?: PaymentAuthContext }>();
    const auth = request.paymentAuth;
    if (!auth) {
      throw new Error('PaymentAuth ausente — ApiKeyGuard deve estar ativo');
    }
    return auth;
  },
);
