import { Body, Controller, Headers, Inject, Post } from '@nestjs/common';
import { ApiHeader, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { PaymentAuth } from '../../common/auth/payment-auth.decorator.js';
import type { PaymentAuthContext } from '../../common/auth/auth.types.js';
import { CreateTapIntentDto } from './dto/create-tap-intent.dto.js';
import { TapIntentsService } from './tap-intents.service.js';

@ApiTags('tap-intents')
@ApiSecurity('api-key')
@Controller('tap-intents')
export class TapIntentsController {
  constructor(@Inject(TapIntentsService) private readonly tapIntents: TapIntentsService) {}

  @Post()
  @ApiHeader({ name: 'Idempotency-Key', required: false })
  create(
    @PaymentAuth() auth: PaymentAuthContext,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() dto: CreateTapIntentDto,
  ) {
    return this.tapIntents.create(auth.tenantId, auth.sourceSystem, idempotencyKey, dto);
  }
}
