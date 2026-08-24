import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { CurrentUser } from '../auth/jwt.guard.js';
import { InjectService } from '../common/inject.js';
import type { ConsumerUserRecord } from '../users/users.service.js';
import { PaymentMethodsService } from './payment-methods.service.js';

class CreatePaymentMethodDto {
  @IsString()
  @MinLength(12)
  @MaxLength(23)
  number!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  holderName!: string;

  @IsString()
  @Matches(/^\d{2}\/\d{2,4}$/, { message: 'expiry deve estar no formato MM/AA' })
  expiry!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4)
  cvv?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  label?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

@ApiTags('payment-methods')
@ApiBearerAuth()
@Controller('me/payment-methods')
export class PaymentMethodsController {
  constructor(
    @InjectService(PaymentMethodsService) private readonly paymentMethods: PaymentMethodsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista cartões do usuário' })
  list(@CurrentUser() user: ConsumerUserRecord) {
    return this.paymentMethods.list(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Cadastra cartão (armazena apenas brand/lastFour)' })
  create(@CurrentUser() user: ConsumerUserRecord, @Body() body: CreatePaymentMethodDto) {
    return this.paymentMethods.create(user.id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove cartão' })
  remove(@CurrentUser() user: ConsumerUserRecord, @Param('id') id: string) {
    return this.paymentMethods.remove(user.id, id);
  }

  @Patch(':id/default')
  @ApiOperation({ summary: 'Define cartão padrão' })
  setDefault(@CurrentUser() user: ConsumerUserRecord, @Param('id') id: string) {
    return this.paymentMethods.setDefault(user.id, id);
  }
}
