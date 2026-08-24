import { Body, Controller, Get, Inject, Param, Patch, Post } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { PaymentAuth } from '../../common/auth/payment-auth.decorator.js';
import type { PaymentAuthContext } from '../../common/auth/auth.types.js';
import {
  CreateProviderAccountDto,
  UpdateProviderAccountDto,
} from '../customers/dto/customer.dto.js';
import { ProviderAccountsService } from './provider-accounts.service.js';

@ApiTags('provider-accounts')
@ApiSecurity('api-key')
@Controller()
export class ProviderAccountsController {
  constructor(@Inject(ProviderAccountsService) private readonly accounts: ProviderAccountsService) {}

  @Post('merchants/:merchantId/provider-accounts')
  create(
    @PaymentAuth() auth: PaymentAuthContext,
    @Param('merchantId') merchantId: string,
    @Body() dto: CreateProviderAccountDto,
  ) {
    return this.accounts.create(auth.tenantId, merchantId, dto);
  }

  @Get('merchants/:merchantId/provider-accounts')
  list(@PaymentAuth() auth: PaymentAuthContext, @Param('merchantId') merchantId: string) {
    return this.accounts.list(auth.tenantId, merchantId);
  }

  @Patch('provider-accounts/:id')
  update(
    @PaymentAuth() auth: PaymentAuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateProviderAccountDto,
  ) {
    return this.accounts.update(auth.tenantId, id, dto);
  }

  @Post('provider-accounts/:id/test')
  test(@PaymentAuth() auth: PaymentAuthContext, @Param('id') id: string) {
    return this.accounts.test(auth.tenantId, id);
  }
}
