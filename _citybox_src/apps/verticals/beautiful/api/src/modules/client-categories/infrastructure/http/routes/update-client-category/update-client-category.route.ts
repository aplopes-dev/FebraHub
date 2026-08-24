import { Body, Controller, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { UpdateClientCategoryUseCase } from '../../../../application/use-cases/update-client-category/update-client-category.use-case';
import {
  ClientCategoryPresenter,
  ClientCategoryResponse,
} from '../../shared/client-category.presenter';
import { UpdateClientCategoryHTTPDTO } from './update-client-category.dto';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';

@ApiTags('Client Categories')
@Controller('v1/client-categories')
export class UpdateClientCategoryRoute {
  constructor(private readonly useCase: UpdateClientCategoryUseCase) {}

  @RequirePermission('update', 'Category')
  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza categoria de cliente' })
  @ApiResponse({ status: 200, description: 'Categoria atualizada' })
  async handle(
    @StoreId() storeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClientCategoryHTTPDTO,
  ): Promise<ClientCategoryResponse> {
    const result = await this.useCase.execute({
      storeId,
      id,
      name: dto.name,
      colorId: dto.colorId,
    });
    return ClientCategoryPresenter.toHTTP(result);
  }
}
