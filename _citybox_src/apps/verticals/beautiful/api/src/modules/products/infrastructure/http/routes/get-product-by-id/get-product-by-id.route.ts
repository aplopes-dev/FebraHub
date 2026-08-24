import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetProductByIdUseCase } from '../../../../application/use-cases/get-product-by-id/get-product-by-id.use-case';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import {
  ProductPresenter,
  type ProductDetailResponse,
} from '../../shared/product.presenter';

@ApiTags('Products')
@Controller('v1/products')
export class GetProductByIdRoute {
  constructor(private readonly useCase: GetProductByIdUseCase) {}

  @RequirePermission('read', 'Product')
  @Get(':id')
  @ApiOperation({
    summary:
      'Obtém os detalhes de um produto de estoque pelo ID (inclui histórico de movimentações)',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalhes do produto com stockMovements (máx. 50)',
  })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
  ): Promise<ProductDetailResponse> {
    const result = await this.useCase.execute({ storeId, id });
    return ProductPresenter.toHTTPDetail(result.product, result.stockMovements);
  }
}
