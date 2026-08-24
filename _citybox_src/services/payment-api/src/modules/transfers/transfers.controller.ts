import { Body, Controller, Get, Inject, Param, Post, Query } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { PaymentAuth } from '../../common/auth/payment-auth.decorator.js';
import type { PaymentAuthContext } from '../../common/auth/auth.types.js';
import { CreateTransferDto } from './dto/transfer.dto.js';
import { TransfersService } from './transfers.service.js';

@ApiTags('transfers')
@ApiSecurity('api-key')
@Controller('transfers')
export class TransfersController {
  constructor(@Inject(TransfersService) private readonly transfers: TransfersService) {}

  @Post()
  create(@PaymentAuth() auth: PaymentAuthContext, @Body() dto: CreateTransferDto) {
    return this.transfers.create(auth.tenantId, auth.sourceSystem, dto);
  }

  @Get()
  list(
    @PaymentAuth() auth: PaymentAuthContext,
    @Query('merchantId') merchantId?: string,
  ) {
    return this.transfers.list(auth.tenantId, merchantId);
  }

  @Get(':id')
  get(@PaymentAuth() auth: PaymentAuthContext, @Param('id') id: string) {
    return this.transfers.get(auth.tenantId, id);
  }
}

@ApiTags('balances')
@ApiSecurity('api-key')
@Controller('balances')
export class BalancesController {
  constructor(@Inject(TransfersService) private readonly transfers: TransfersService) {}

  @Get()
  get(
    @PaymentAuth() auth: PaymentAuthContext,
    @Query('merchantId') merchantId: string,
  ) {
    return this.transfers.getBalance(auth.tenantId, merchantId);
  }
}
