import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ListStoresUseCase } from '../../../../application/use-cases/list-stores/list-stores.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { ListStoresPresenter } from './list-stores.presenter';
import { parseCsvParam } from './list-stores.query';

@ApiTags('stores')
@Controller('v1/stores')
@RequirePermission('platform.admin')
export class ListStoresRoute {
  constructor(private readonly listStores: ListStoresUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Listar lojas' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'perPage', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'vertical', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'createdFrom', required: false })
  @ApiQuery({ name: 'createdTo', required: false })
  async handle(
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
    @Query('search') search?: string,
    @Query('vertical') vertical?: string | string[],
    @Query('status') status?: string | string[],
    @Query('createdFrom') createdFrom?: string,
    @Query('createdTo') createdTo?: string,
  ) {
    const result = await this.listStores.execute({
      page: page ? Number(page) : undefined,
      perPage: perPage ? Number(perPage) : undefined,
      search:
        typeof search === 'string' ? search.trim() || undefined : undefined,
      vertical: parseCsvParam(vertical),
      status: parseCsvParam(status),
      createdFrom,
      createdTo,
    });

    return ListStoresPresenter.toHttp(result.stores, {
      total: result.total,
      page: result.page,
      perPage: result.perPage,
      totalPages: result.totalPages,
    });
  }
}
