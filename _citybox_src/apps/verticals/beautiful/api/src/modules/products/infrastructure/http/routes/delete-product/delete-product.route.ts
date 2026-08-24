import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeleteProductUseCase } from '../../../../application/use-cases/delete-product/delete-product.use-case';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';

@ApiTags('Products')
@Controller('v1/products')
export class DeleteProductRoute {
  constructor(private readonly useCase: DeleteProductUseCase) {}

  @RequirePermission('delete', 'Product')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um produto do estoque' })
  @ApiResponse({ status: 204, description: 'Produto removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.useCase.execute({ storeId, id });
  }
}
