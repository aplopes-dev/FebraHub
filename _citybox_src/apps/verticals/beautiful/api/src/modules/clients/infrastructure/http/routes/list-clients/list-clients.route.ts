import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ListClientsUseCase } from '../../../../application/use-cases/list-clients/list-clients.use-case';
import { ListClientsQueryDTO } from './list-clients.dto';
import { ClientPresenter } from '../../shared/client.presenter';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';

@ApiTags('Clients')
@Controller('v1/clients')
export class ListClientsRoute {
  constructor(private readonly useCase: ListClientsUseCase) {}

  @RequirePermission('read', 'Client')
  @Get()
  @ApiOperation({ summary: 'Lista os clientes cadastrados com paginação' })
  @ApiResponse({ status: 200, description: 'Lista paginada de clientes retornada' })
  async handle(
    @StoreId() storeId: string,
    @Query() query: ListClientsQueryDTO,
  ) {
    const result = await this.useCase.execute({
      storeId,
      search: query.search,
      page: query.page,
      perPage: query.perPage,
    });

    return {
      data: ClientPresenter.toHTTPList(result.items),
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
