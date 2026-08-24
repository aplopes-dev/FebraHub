import { Body, Controller, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateProductUseCase } from '../../../../application/use-cases/update-product/update-product.use-case';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { UpdateProductHTTPDTO } from './update-product.dto';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import {
  ProductPresenter,
  ProductResponse,
} from '../../shared/product.presenter';

@ApiTags('Products')
@Controller('v1/products')
export class UpdateProductRoute {
  constructor(private readonly useCase: UpdateProductUseCase) {}

  @RequirePermission('update', 'Product')
  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza as informações de um produto no estoque' })
  @ApiResponse({ status: 200, description: 'Produto atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductHTTPDTO,
  ): Promise<ProductResponse> {
    const result = await this.useCase.execute({
      storeId,
      id,
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
