import { Body, Controller, Get, Inject, Param, Patch, Post } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { RequiresAdmin } from '../../common/auth/auth.decorators.js';
import { PaymentAuth } from '../../common/auth/payment-auth.decorator.js';
import type { PaymentAuthContext } from '../../common/auth/auth.types.js';
import { RegisterWebhookDto, UpdateWebhookDto } from './dto/webhook.dto.js';
import { WebhooksService } from './webhooks.service.js';

@ApiTags('webhooks')
@ApiSecurity('api-key')
@Controller('webhooks')
export class WebhooksController {
  constructor(@Inject(WebhooksService) private readonly webhooks: WebhooksService) {}

  @Post()
  @RequiresAdmin()
  register(@PaymentAuth() auth: PaymentAuthContext, @Body() dto: RegisterWebhookDto) {
    return this.webhooks.register(auth.tenantId, dto);
  }

  @Get()
  list(@PaymentAuth() auth: PaymentAuthContext) {
    return this.webhooks.list(auth.tenantId);
  }

  @Patch(':id')
  @RequiresAdmin()
  update(
    @PaymentAuth() auth: PaymentAuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateWebhookDto,
  ) {
    return this.webhooks.update(auth.tenantId, id, dto);
  }

  @Post(':id/test')
  @RequiresAdmin()
  test(@PaymentAuth() auth: PaymentAuthContext, @Param('id') id: string) {
    return this.webhooks.test(auth.tenantId, id);
  }
}
