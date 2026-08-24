import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ChargesService } from '../charges/charges.service.js';
import type { CreateTapIntentDto } from './dto/create-tap-intent.dto.js';

@Injectable()
export class TapIntentsService {
  constructor(@Inject(ChargesService) private readonly charges: ChargesService) {}

  create(
    tenantId: string,
    authSourceSystem: string,
    idempotencyKey: string | undefined,
    dto: CreateTapIntentDto,
  ) {
    const key = idempotencyKey ?? `tap-${randomUUID()}`;
    return this.charges.create(tenantId, authSourceSystem, key, {
      ...dto,
      paymentMethods: ['INFINITE_TAP'],
      provider: 'INFINITE_PAY',
      metadata: {
        ...(dto.metadata ?? {}),
        paymentFlow: 'infinite-tap',
      },
    });
  }
}
