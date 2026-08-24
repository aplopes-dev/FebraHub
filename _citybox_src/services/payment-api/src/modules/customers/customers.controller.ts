import { Body, Controller, Get, Inject, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { PaymentAuth } from '../../common/auth/payment-auth.decorator.js';
import type { PaymentAuthContext } from '../../common/auth/auth.types.js';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto.js';
import { CustomersService } from './customers.service.js';

@ApiTags('customers')
@ApiSecurity('api-key')
@Controller('customers')
export class CustomersController {
  constructor(@Inject(CustomersService) private readonly customers: CustomersService) {}

  @Post()
  create(@PaymentAuth() auth: PaymentAuthContext, @Body() dto: CreateCustomerDto) {
    return this.customers.create(auth.tenantId, dto);
  }

  @Get()
  list(@PaymentAuth() auth: PaymentAuthContext, @Query('merchantId') merchantId?: string) {
    return this.customers.list(auth.tenantId, merchantId);
  }

  @Get(':id')
  get(@PaymentAuth() auth: PaymentAuthContext, @Param('id') id: string) {
    return this.customers.get(auth.tenantId, id);
  }

  @Patch(':id')
  update(
    @PaymentAuth() auth: PaymentAuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customers.update(auth.tenantId, id, dto);
  }
}
