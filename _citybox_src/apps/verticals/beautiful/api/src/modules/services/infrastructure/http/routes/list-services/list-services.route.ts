import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ListServicesUseCase } from '../../../../application/use-cases/list-services/list-services.use-case';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ListServicesQueryDTO } from './list-services.dto';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { ServicePresenter } from '../../shared/service.presenter';

@ApiTags('Services')
@Controller('v1/services')
export class ListServicesRoute {
  constructor(private readonly useCase: ListServicesUseCase) {}

  @RequirePermission('read', 'Service')
  @Get()
  @ApiOperation({ summary: 'Lista os serviços cadastrados no catálogo' })
  @ApiResponse({ status: 200, description: 'Lista de serviços retornada' })
  async handle(
    @StoreId() storeId: string,
    @Query() query: ListServicesQueryDTO,
  ) {
    const result = await this.useCase.execute({
      storeId,
      search: query.search,
      category: query.category,
      active: query.active,
      page: query.page,
      perPage: query.perPage,
    });

    return {
      data: ServicePresenter.toHTTPList(result.items),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
      stats: result.stats,
    };
  }
}
