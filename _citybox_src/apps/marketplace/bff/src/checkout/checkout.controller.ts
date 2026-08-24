import { Body, Controller, Delete, Get, Headers, HttpCode, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { InjectService } from '../common/inject.js';
import { CurrentUser } from '../auth/jwt.guard.js';
import type { ConsumerUserRecord } from '../users/users.service.js';
import { CheckoutService } from './checkout.service.js';

class CartItemInputDto {
  @IsString()
  productId!: string;

  @IsInt()
  quantity!: number;
}

class PatchSessionDto {
  @IsOptional()
  @IsString()
  selectedAddressId?: string | null;

  @IsOptional()
  @IsString()
  shippingOptionId?: string | null;

  @IsOptional()
  @IsString()
  paymentType?: string | null;

  @IsOptional()
  @IsString()
  paymentMethodId?: string | null;

  @IsOptional()
  @IsString()
  boletoCpf?: string | null;
}

class ShippingOptionsDto {
  @IsOptional()
  @IsString()
  addressId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemInputDto)
  items?: CartItemInputDto[];
}

class ValidateCouponDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsNumber()
  subtotal?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemInputDto)
  items?: CartItemInputDto[];
}

class PreviewDto {
  @IsOptional()
  @IsString()
  addressId?: string;

  @IsOptional()
  @IsString()
  shippingOptionId?: string;

  @IsOptional()
  @IsString()
  couponCode?: string | null;

  @IsOptional()
  @IsString()
  paymentType?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemInputDto)
  items?: CartItemInputDto[];
}

class PaymentInputDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @IsOptional()
  @IsString()
  cpf?: string;
}

class CreateOrderDto extends PreviewDto {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PaymentInputDto)
  payment?: PaymentInputDto;

  @IsOptional()
  @IsBoolean()
  buyNow?: boolean;
}

@ApiTags('checkout')
@ApiBearerAuth()
@Controller()
export class CheckoutController {
  constructor(@InjectService(CheckoutService) private readonly checkout: CheckoutService) {}

  @Get('checkout/session')
  @ApiOperation({ summary: 'Sessão de checkout (cart + session + preview)' })
  getSession(@CurrentUser() user: ConsumerUserRecord) {
    return this.checkout.getSessionData(user);
  }

  @Patch('checkout/session')
  @ApiOperation({ summary: 'Atualiza parcialmente a sessão de checkout' })
  patchSession(@CurrentUser() user: ConsumerUserRecord, @Body() body: PatchSessionDto) {
    return this.checkout.patchSession(user, body);
  }

  @Post('checkout/shipping-options')
  @HttpCode(200)
  @ApiOperation({ summary: 'Opções de frete para o endereço' })
  shippingOptions(@CurrentUser() user: ConsumerUserRecord, @Body() body: ShippingOptionsDto) {
    return this.checkout.shippingOptions(user, body.addressId);
  }

  @Get('me/coupons')
  @ApiOperation({ summary: 'Cupons ativos com aplicabilidade contra o carrinho' })
  listCoupons(@CurrentUser() user: ConsumerUserRecord) {
    return this.checkout.listCoupons(user);
  }

  @Post('checkout/coupons/validate')
  @HttpCode(200)
  @ApiOperation({ summary: 'Valida e aplica cupom na sessão' })
  validateCoupon(@CurrentUser() user: ConsumerUserRecord, @Body() body: ValidateCouponDto) {
    return this.checkout.validateCoupon(user, body);
  }

  @Delete('checkout/coupons')
  @ApiOperation({ summary: 'Remove o cupom aplicado' })
  removeCoupon(@CurrentUser() user: ConsumerUserRecord) {
    return this.checkout.removeCoupon(user);
  }

  @Post('checkout/preview')
  @HttpCode(200)
  @ApiOperation({ summary: 'Preview de totais do checkout' })
  preview(@CurrentUser() user: ConsumerUserRecord, @Body() body: PreviewDto) {
    return this.checkout.preview(user, body);
  }

  @Post('checkout/orders')
  @ApiOperation({ summary: 'Cria pedido (idempotente por Idempotency-Key)' })
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  createOrder(
    @CurrentUser() user: ConsumerUserRecord,
    @Body() body: CreateOrderDto,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('authorization') authorization?: string,
  ) {
    const bearerToken = authorization?.startsWith('Bearer ')
      ? authorization.slice(7)
      : undefined;
    return this.checkout.createOrder(user, body, idempotencyKey, bearerToken);
  }
}
