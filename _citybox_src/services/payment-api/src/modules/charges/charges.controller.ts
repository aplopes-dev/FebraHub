import {
  Body,
  Controller,
  Get,
  Headers,
  Inject,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiHeader, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { PaymentAuth } from '../../common/auth/payment-auth.decorator.js';
import type { PaymentAuthContext } from '../../common/auth/auth.types.js';
import { CreateChargeDto } from './dto/create-charge.dto.js';
import { ChargesService } from './charges.service.js';

@ApiTags('charges')
@ApiSecurity('api-key')
@Controller('charges')
export class ChargesController {
  constructor(@Inject(ChargesService) private readonly charges: ChargesService) {}

  @Post()
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  create(
    @PaymentAuth() auth: PaymentAuthContext,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() dto: CreateChargeDto,
  ) {
    return this.charges.create(auth.tenantId, auth.sourceSystem, idempotencyKey, dto);
  }

  @Get()
  list(@PaymentAuth() auth: PaymentAuthContext, @Query('sourceSystem') sourceSystem?: string) {
    return this.charges.list(auth.tenantId, sourceSystem);
  }

  @Get(':id')
  get(@PaymentAuth() auth: PaymentAuthContext, @Param('id') id: string) {
    return this.charges.get(auth.tenantId, id);
  }

  @Post(':id/cancel')
  cancel(@PaymentAuth() auth: PaymentAuthContext, @Param('id') id: string) {
    return this.charges.cancel(auth.tenantId, id);
  }

  @Post(':id/sync-status')
  syncStatus(@PaymentAuth() auth: PaymentAuthContext, @Param('id') id: string) {
    return this.charges.syncStatus(auth.tenantId, id);
  }
}
