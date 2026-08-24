import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  IsInt,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';

import { ListStockProductsUseCase } from '../../../../application/use-cases/products/list-stock-products.use-case';
import { CreateStockProductUseCase } from '../../../../application/use-cases/products/create-stock-product.use-case';
import { UpdateStockProductUseCase } from '../../../../application/use-cases/products/update-stock-product.use-case';
import { DeleteStockProductUseCase } from '../../../../application/use-cases/products/delete-stock-product.use-case';

class ListStockProductsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  perPage?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  search?: string;

  @IsOptional()
  @IsIn([
    'name',
    'category',
    'sku',
    'supplier',
    'quantity',
    'status',
    'activeValue',
  ])
  sortBy?:
    | 'name'
    | 'category'
    | 'sku'
    | 'supplier'
    | 'quantity'
    | 'status'
    | 'activeValue';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

class CreateStockProductDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  category!: string;

  @IsInt()
  @Min(0)
  quantity!: number;

  @IsInt()
  @Min(0)
  minQuantity!: number;

  @IsNumber()
  @Min(0)
  unitCost!: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  sku?: string | null;

  @IsOptional()
  @IsUUID()
  supplierId?: string | null;

  @IsOptional()
  @IsString()
  photoUrl?: string | null;

  @IsOptional()
  @IsString()
  photoKey?: string | null;
}

class UpdateStockProductDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  category!: string;

  @IsInt()
  @Min(0)
  minQuantity!: number;

  @IsNumber()
  @Min(0)
  unitCost!: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  sku?: string | null;

  @IsOptional()
  @IsUUID()
  supplierId?: string | null;

  @IsOptional()
  @IsString()
  photoUrl?: string | null;

  @IsOptional()
  @IsString()
  photoKey?: string | null;
}

@ApiTags('stock-products')
@Controller('v1/stock-products')
@RequirePermission('manage', 'Stock')
export class StockProductsRoute {
  constructor(
    private readonly listProducts: ListStockProductsUseCase,
    private readonly createProduct: CreateStockProductUseCase,
    private readonly updateProduct: UpdateStockProductUseCase,
    private readonly deleteProduct: DeleteStockProductUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar produtos' })
  async list(
    @StoreId() storeId: string,
    @Query() query: ListStockProductsQueryDto,
  ) {
    const result = await this.listProducts.execute({
      storeId,
      search: query.search,
      page: query.page,
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

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar produto' })
  async create(
    @StoreId() storeId: string,
    @Body() body: CreateStockProductDto,
  ) {
    const product = await this.createProduct.execute({
      storeId,
      name: body.name,
      category: body.category,
      quantity: body.quantity,
      minQuantity: body.minQuantity,
      unitCost: body.unitCost,
      sku: body.sku ?? undefined,
      supplierId: body.supplierId ?? null,
      photoKey: body.photoKey ?? null,
    });

    return {
      data: {
        id: product.id,
        name: product.name,
        photoUrl: product.photoObjectKey
          ? `/api/v1/stock-products/${product.id}/photo`
          : null,
      },
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar produto' })
  async update(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @Body() body: UpdateStockProductDto,
  ) {
    const product = await this.updateProduct.execute({
      storeId,
      id,
      name: body.name,
      category: body.category,
      minQuantity: body.minQuantity,
      unitCost: body.unitCost,
      sku: body.sku ?? null,
      supplierId: body.supplierId ?? null,
      photoKey: body.photoKey === undefined ? undefined : body.photoKey,
    });

    return {
      data: {
        id: product.id,
        name: product.name,
      },
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir produto' })
  async remove(@StoreId() storeId: string, @Param('id') id: string) {
    await this.deleteProduct.execute({ storeId, productId: id });
  }
}
