import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { paginated } from '../common/envelope.js';
import { InjectService } from '../common/inject.js';
import { CurrentUser } from '../auth/jwt.guard.js';
import type { ConsumerUserRecord } from '../users/users.service.js';
import { OrdersService } from './orders.service.js';

class ListOrdersQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;

  @IsOptional()
  @IsString()
  status?: string;
}

class CancelOrderDto {
  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

class ReturnItemDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsInt()
  quantity?: number;
}

class CreateReturnDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ReturnItemDto)
  item?: ReturnItemDto;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

@ApiTags('orders')
@ApiBearerAuth()
@Controller('me/orders')
export class OrdersController {
  constructor(@InjectService(OrdersService) private readonly orders: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Lista pedidos do usuário (paginado)' })
  async list(@CurrentUser() user: ConsumerUserRecord, @Query() query: ListOrdersQuery) {
    const { orders, meta } = await this.orders.list(user, query);
    return paginated({ orders }, meta);
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Detalhe do pedido (suporta ETag/If-None-Match)' })
  async get(
    @CurrentUser() user: ConsumerUserRecord,
    @Param('orderId') orderId: string,
    @Res({ passthrough: true }) res: Response,
    @Headers('if-none-match') ifNoneMatch?: string,
  ) {
    const { order, etag } = await this.orders.get(user, orderId);
    res.setHeader('ETag', etag);
    if (ifNoneMatch && ifNoneMatch === etag) {
      res.status(304);
      return undefined;
    }
    return { order };
  }

  @Get(':orderId/tracking')
  @ApiOperation({ summary: 'Rastreamento do pedido' })
  tracking(@CurrentUser() user: ConsumerUserRecord, @Param('orderId') orderId: string) {
    return this.orders.tracking(user, orderId);
  }

  @Post(':orderId/buy-again')
  @HttpCode(200)
  @ApiOperation({ summary: 'Adiciona itens do pedido ao carrinho' })
  buyAgain(@CurrentUser() user: ConsumerUserRecord, @Param('orderId') orderId: string) {
    return this.orders.buyAgain(user, orderId);
  }

  @Get(':orderId/invoice')
  @ApiOperation({ summary: 'Nota fiscal (placeholder)' })
  invoice(@CurrentUser() user: ConsumerUserRecord, @Param('orderId') orderId: string) {
    return this.orders.invoice(user, orderId);
  }

  @Post(':orderId/cancel')
  @HttpCode(200)
  @ApiOperation({ summary: 'Cancela pedido (CONFIRMED/PREPARING)' })
  cancel(
    @CurrentUser() user: ConsumerUserRecord,
    @Param('orderId') orderId: string,
    @Body() body: CancelOrderDto,
  ) {
    return this.orders.cancel(user, orderId, body);
  }

  @Post(':orderId/returns')
  @ApiOperation({ summary: 'Solicita devolução de item do pedido' })
  createReturn(
    @CurrentUser() user: ConsumerUserRecord,
    @Param('orderId') orderId: string,
    @Body() body: CreateReturnDto,
  ) {
    return this.orders.createReturn(user, orderId, body);
  }

  @Get(':orderId/returns/:returnId')
  @ApiOperation({ summary: 'Detalhe da devolução' })
  getReturn(
    @CurrentUser() user: ConsumerUserRecord,
    @Param('orderId') orderId: string,
    @Param('returnId') returnId: string,
  ) {
    return this.orders.getReturn(user, orderId, returnId);
  }
}
