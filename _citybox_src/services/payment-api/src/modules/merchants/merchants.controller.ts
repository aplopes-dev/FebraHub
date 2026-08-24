import { Body, Controller, Get, Inject, Param, Patch, Post } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { PaymentAuth } from '../../common/auth/payment-auth.decorator.js';
import type { PaymentAuthContext } from '../../common/auth/auth.types.js';
import { CreateMerchantDto, UpdateMerchantDto } from './dto/merchant.dto.js';
import { MerchantsService } from './merchants.service.js';

@ApiTags('merchants')
@ApiSecurity('api-key')
@Controller('merchants')
export class MerchantsController {
  constructor(@Inject(MerchantsService) private readonly merchants: MerchantsService) {}

  @Post()
  create(@PaymentAuth() auth: PaymentAuthContext, @Body() dto: CreateMerchantDto) {
    return this.merchants.create(auth.tenantId, dto);
  }

  @Get()
  list(@PaymentAuth() auth: PaymentAuthContext) {
    return this.merchants.list(auth.tenantId);
  }

  @Get(':id')
  get(@PaymentAuth() auth: PaymentAuthContext, @Param('id') id: string) {
    return this.merchants.get(auth.tenantId, id);
  }

  @Patch(':id')
  update(
    @PaymentAuth() auth: PaymentAuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateMerchantDto,
  ) {
    return this.merchants.update(auth.tenantId, id, dto);
  }
}
