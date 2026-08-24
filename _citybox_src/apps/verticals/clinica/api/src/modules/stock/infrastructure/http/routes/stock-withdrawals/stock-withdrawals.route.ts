import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import {
  resolveAuthenticatedUserDisplayName,
  type AuthenticatedUser,
} from '../../../../../../shared/infra/http/auth/authenticated-user';

import { CreateStockWithdrawalUseCase } from '../../../../application/use-cases/withdrawals/create-stock-withdrawal.use-case';

class CreateStockWithdrawalBodyDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsUUID()
  requestedById?: string;

  @IsOptional()
  @IsString()
  requestedByName?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

@ApiTags('stock-withdrawals')
@Controller('v1/stock-withdrawals')
@RequirePermission('manage', 'Stock')
export class StockWithdrawalsRoute {
  constructor(
    private readonly createWithdrawal: CreateStockWithdrawalUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Criar retirada no estoque' })
  async create(
    @StoreId() storeId: string,
    @Body() dto: CreateStockWithdrawalBodyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.createWithdrawal.execute({
      storeId,
      productId: dto.productId,
      quantity: dto.quantity,
      requestedById: dto.requestedById ?? null,
      requestedByName: dto.requestedById
        ? (dto.requestedByName?.trim() || null)
        : null,
      notes: dto.notes ?? null,
      authorizedById: user.sub,
      authorizedByName: resolveAuthenticatedUserDisplayName(user),
    });

    return { data: null };
  }
}
