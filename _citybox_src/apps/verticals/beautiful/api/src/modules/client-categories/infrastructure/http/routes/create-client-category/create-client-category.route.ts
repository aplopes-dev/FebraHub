import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { CreateClientCategoryUseCase } from '../../../../application/use-cases/create-client-category/create-client-category.use-case';
import {
  ClientCategoryPresenter,
  ClientCategoryResponse,
} from '../../shared/client-category.presenter';
import { CreateClientCategoryHTTPDTO } from './create-client-category.dto';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';

@ApiTags('Client Categories')
@Controller('v1/client-categories')
export class CreateClientCategoryRoute {
  constructor(private readonly useCase: CreateClientCategoryUseCase) {}

  @RequirePermission('create', 'Category')
  @Post()
  @ApiOperation({ summary: 'Cria categoria de cliente' })
  @ApiResponse({ status: 201, description: 'Categoria criada' })
  @ApiResponse({ status: 409, description: 'Nome duplicado' })
  async handle(
    @StoreId() storeId: string,
    @Body() dto: CreateClientCategoryHTTPDTO,
  ): Promise<ClientCategoryResponse> {
    const result = await this.useCase.execute({
      storeId,
      name: dto.name,
      colorId: dto.colorId,
    });
    return ClientCategoryPresenter.toHTTP(result);
  }
}
