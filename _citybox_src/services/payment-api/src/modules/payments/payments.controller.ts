import { Body, Controller, Get, Inject, Param, Post, Query } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { PaymentAuth } from '../../common/auth/payment-auth.decorator.js';
import type { PaymentAuthContext } from '../../common/auth/auth.types.js';
import { RefundPaymentDto } from './dto/refund-payment.dto.js';
import { CapturePaymentDto } from './dto/capture-payment.dto.js';
import { PaymentsService } from './payments.service.js';

@ApiTags('payments')
@ApiSecurity('api-key')
@Controller('payments')
export class PaymentsController {
  constructor(@Inject(PaymentsService) private readonly payments: PaymentsService) {}

  @Get()
  list(@PaymentAuth() auth: PaymentAuthContext, @Query('chargeId') chargeId?: string) {
    return this.payments.list(auth.tenantId, chargeId);
  }

  @Get(':id')
  get(@PaymentAuth() auth: PaymentAuthContext, @Param('id') id: string) {
    return this.payments.get(auth.tenantId, id);
  }

  @Post(':id/refund')
  refund(
    @PaymentAuth() auth: PaymentAuthContext,
    @Param('id') id: string,
    @Body() dto: RefundPaymentDto,
  ) {
    return this.payments.refund(auth.tenantId, id, auth.sourceSystem, dto);
  }

  @Post(':id/capture')
  capture(
    @PaymentAuth() auth: PaymentAuthContext,
    @Param('id') id: string,
    @Body() dto: CapturePaymentDto,
  ) {
    return this.payments.capture(auth.tenantId, id, auth.sourceSystem, dto);
  }

  @Post(':id/void')
  voidPayment(@PaymentAuth() auth: PaymentAuthContext, @Param('id') id: string) {
    return this.payments.voidPayment(auth.tenantId, id, auth.sourceSystem);
  }
}
