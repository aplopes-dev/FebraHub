import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ListClientCategoriesUseCase } from '../../../../application/use-cases/list-client-categories/list-client-categories.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import {
  ClientCategoryPresenter,
  ClientCategoryResponse,
} from '../../shared/client-category.presenter';

@ApiTags('Client Categories')
@Controller('v1/client-categories')
export class ListClientCategoriesRoute {
  constructor(private readonly useCase: ListClientCategoriesUseCase) {}

  @RequirePermission('read', 'Category')
  @Get()
  @ApiOperation({ summary: 'Lista categorias de cliente' })
  @ApiResponse({ status: 200, description: 'Lista de categorias' })
  async handle(@StoreId() storeId: string): Promise<ClientCategoryResponse[]> {
    const result = await this.useCase.execute({ storeId });
    return ClientCategoryPresenter.toHTTPList(result);
  }
}
