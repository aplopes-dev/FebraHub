import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import {
  resolveAuthenticatedUserDisplayName,
  type AuthenticatedUser,
} from '../../../../../../shared/infra/http/auth/authenticated-user';

import { CreateStockEntryUseCase } from '../../../../application/use-cases/entries/create-stock-entry.use-case';
import { CreateStockBulkEntryUseCase } from '../../../../application/use-cases/entries/create-stock-bulk-entry.use-case';

class CreateStockEntryBodyDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

class StockBulkEntryItemDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

class CreateStockBulkEntryBodyDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockBulkEntryItemDto)
  items!: StockBulkEntryItemDto[];
}

@ApiTags('stock-entries')
@Controller('v1/stock-entries')
@RequirePermission('manage', 'Stock')
export class StockEntriesRoute {
  constructor(
    private readonly createEntry: CreateStockEntryUseCase,
    private readonly createBulkEntry: CreateStockBulkEntryUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Criar entrada no estoque' })
  async create(
    @StoreId() storeId: string,
    @Body() dto: CreateStockEntryBodyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.createEntry.execute({
      storeId,
      productId: dto.productId,
      quantity: dto.quantity,
      notes: dto.notes ?? null,
      authorizedById: user.sub,
      authorizedByName: resolveAuthenticatedUserDisplayName(user),
    });
    return { data: null };
  }

  @Post('bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Criar entrada em lote' })
  async createBulk(
    @StoreId() storeId: string,
    @Body() dto: CreateStockBulkEntryBodyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.createBulkEntry.execute({
      storeId,
      items: dto.items,
      authorizedById: user.sub,
      authorizedByName: resolveAuthenticatedUserDisplayName(user),
    });
    return { data: null };
  }
}
