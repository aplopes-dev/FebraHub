import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateProductUseCase } from '../../../../application/use-cases/create-product/create-product.use-case';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { CreateProductHTTPDTO } from './create-product.dto';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import {
  ProductPresenter,
  ProductResponse,
} from '../../shared/product.presenter';

@ApiTags('Products')
@Controller('v1/products')
export class CreateProductRoute {
  constructor(private readonly useCase: CreateProductUseCase) {}

  @RequirePermission('create', 'Product')
  @Post()
  @ApiOperation({ summary: 'Cadastra um novo produto de consumo no estoque' })
  @ApiResponse({ status: 201, description: 'Produto criado com sucesso' })
  async handle(
    @StoreId() storeId: string,
    @Body() dto: CreateProductHTTPDTO,
  ): Promise<ProductResponse> {
    const result = await this.useCase.execute({
      storeId,
      name: dto.name,
      sku: dto.sku,
      unitOfMeasure: dto.unitOfMeasure,
      stockQuantity: dto.stockQuantity,
      minStockQuantity: dto.minStockQuantity,
      costPrice: dto.costPrice,
      description: dto.description,
      active: dto.active,
    });

    return ProductPresenter.toHTTP(result);
  }
}
