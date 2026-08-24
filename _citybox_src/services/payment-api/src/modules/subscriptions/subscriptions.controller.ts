import { Body, Controller, Get, Inject, Param, Post, Query } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { PaymentAuth } from '../../common/auth/payment-auth.decorator.js';
import type { PaymentAuthContext } from '../../common/auth/auth.types.js';
import { CreateSubscriptionDto, ResumeSubscriptionDto } from './dto/subscription.dto.js';
import { SubscriptionsService } from './subscriptions.service.js';

@ApiTags('subscriptions')
@ApiSecurity('api-key')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(@Inject(SubscriptionsService) private readonly subscriptions: SubscriptionsService) {}

  @Post()
  create(@PaymentAuth() auth: PaymentAuthContext, @Body() dto: CreateSubscriptionDto) {
    return this.subscriptions.create(auth.tenantId, auth.sourceSystem, dto);
  }

  @Get()
  list(@PaymentAuth() auth: PaymentAuthContext, @Query('sourceSystem') sourceSystem?: string) {
    return this.subscriptions.list(auth.tenantId, sourceSystem);
  }

  @Get(':id')
  get(@PaymentAuth() auth: PaymentAuthContext, @Param('id') id: string) {
    return this.subscriptions.get(auth.tenantId, id);
  }

  @Post(':id/cancel')
  cancel(@PaymentAuth() auth: PaymentAuthContext, @Param('id') id: string) {
    return this.subscriptions.cancel(auth.tenantId, id, auth.sourceSystem);
  }

  @Post(':id/pause')
  pause(@PaymentAuth() auth: PaymentAuthContext, @Param('id') id: string) {
    return this.subscriptions.pause(auth.tenantId, id, auth.sourceSystem);
  }

  @Post(':id/resume')
  resume(
    @PaymentAuth() auth: PaymentAuthContext,
    @Param('id') id: string,
    @Body() dto: ResumeSubscriptionDto,
  ) {
    return this.subscriptions.resume(auth.tenantId, id, auth.sourceSystem, dto);
  }
}
