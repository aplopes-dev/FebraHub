import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { InjectService } from '../common/inject.js';
import { CurrentUser } from '../auth/jwt.guard.js';
import type { ConsumerUserRecord } from '../users/users.service.js';
import { CartService } from './cart.service.js';
import { CheckoutService } from '../checkout/checkout.service.js';

class AddCartItemDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsInt()
  quantity?: number;
}

class UpdateCartItemDto {
  @IsOptional()
  @IsInt()
  quantity?: number;
}

class ApplyCouponDto {
  @IsOptional()
  @IsString()
  code?: string;
}

@ApiTags('cart')
@ApiBearerAuth()
@Controller('me/cart')
export class CartController {
  constructor(
    @InjectService(CartService) private readonly cart: CartService,
    @InjectService(CheckoutService) private readonly checkout: CheckoutService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Carrinho do usuário' })
  getCart(@CurrentUser() user: ConsumerUserRecord) {
    return this.cart.getCart(user.id);
  }

  @Delete()
  @HttpCode(204)
  @ApiOperation({ summary: 'Limpa itens e cupom do carrinho' })
  async clear(@CurrentUser() user: ConsumerUserRecord) {
    await this.cart.clear(user.id);
  }

  @Post('items')
  @HttpCode(200)
  @ApiOperation({ summary: 'Adiciona/incrementa item no carrinho' })
  addItem(@CurrentUser() user: ConsumerUserRecord, @Body() body: AddCartItemDto) {
    return this.cart.addItem(user.id, body.productId, body.quantity);
  }

  @Patch('items/:productId')
  @ApiOperation({ summary: 'Atualiza quantidade (0 remove o item)' })
  updateItem(
    @CurrentUser() user: ConsumerUserRecord,
    @Param('productId') productId: string,
    @Body() body: UpdateCartItemDto,
  ) {
    return this.cart.updateItem(user.id, productId, body.quantity);
  }

  @Delete('items/:productId')
  @ApiOperation({ summary: 'Remove item do carrinho' })
  removeItem(@CurrentUser() user: ConsumerUserRecord, @Param('productId') productId: string) {
    return this.cart.removeItem(user.id, productId);
  }

  @Post('coupon')
  @HttpCode(200)
  @ApiOperation({ summary: 'Aplica cupom no carrinho' })
  applyCoupon(@CurrentUser() user: ConsumerUserRecord, @Body() body: ApplyCouponDto) {
    return this.checkout.applyCartCoupon(user, body.code);
  }
}
