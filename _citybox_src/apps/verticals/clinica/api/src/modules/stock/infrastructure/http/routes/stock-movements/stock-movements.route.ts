import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';

import { ListStockMovementsUseCase } from '../../../../application/use-cases/movements/list-stock-movements.use-case';

const MOVEMENT_TYPES = ['entry', 'withdrawal', 'adjustment'] as const;

class ListStockMovementsQueryDto {
  @IsOptional()
  @IsIn(MOVEMENT_TYPES)
  type?: (typeof MOVEMENT_TYPES)[number];

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsInt()
  @Type(() => Number)
  @Min(1)
  page!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  perPage?: number;

  @IsOptional()
  @IsIn(['product', 'quantity', 'withdrawnBy', 'authorizedBy', 'date'])
  sortBy?: 'product' | 'quantity' | 'withdrawnBy' | 'authorizedBy' | 'date';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

@ApiTags('stock-movements')
@Controller('v1/stock-movements')
@RequirePermission('manage', 'Stock')
export class StockMovementsRoute {
  constructor(private readonly listMovements: ListStockMovementsUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Listar movimentações' })
  async list(
    @StoreId() storeId: string,
    @Query() query: ListStockMovementsQueryDto,
  ) {
    const result = await this.listMovements.execute({
      storeId,
      type: query.type,
      productId: query.productId,
      startDate: query.startDate,
      endDate: query.endDate,
      page: query.page ?? 1,
      perPage: query.perPage ?? 20,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return {
      data: result.items,
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }
}
