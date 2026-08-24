import {
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { DeleteClientCategoryUseCase } from '../../../../application/use-cases/delete-client-category/delete-client-category.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';

@ApiTags('Client Categories')
@Controller('v1/client-categories')
export class DeleteClientCategoryRoute {
  constructor(private readonly useCase: DeleteClientCategoryUseCase) {}

  @RequirePermission('update', 'Category')
  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove categoria de cliente' })
  @ApiResponse({ status: 204, description: 'Categoria removida' })
  async handle(
    @StoreId() storeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.useCase.execute({ storeId, id });
  }
}
