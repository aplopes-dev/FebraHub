import { Controller, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ToggleProductActiveUseCase } from '../../../../application/use-cases/toggle-product-active/toggle-product-active.use-case';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import {
  ProductPresenter,
  ProductResponse,
} from '../../shared/product.presenter';

@ApiTags('Products')
@Controller('v1/products')
export class ToggleProductActiveRoute {
  constructor(private readonly useCase: ToggleProductActiveUseCase) {}

  @RequirePermission('update', 'Product')
  @Patch(':id/toggle-active')
  @ApiOperation({
    summary: 'Alterna o status ativo/inativo de um produto no estoque',
  })
  @ApiResponse({ status: 200, description: 'Status alterado com sucesso' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
  ): Promise<ProductResponse> {
    const result = await this.useCase.execute({ storeId, id });
    return ProductPresenter.toHTTP(result);
  }
}
