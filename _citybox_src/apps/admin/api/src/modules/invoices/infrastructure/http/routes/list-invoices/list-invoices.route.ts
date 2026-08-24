import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListInvoicesUseCase } from '../../../../application/use-cases/list-invoices/list-invoices.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { ListInvoicesQueryDto } from './list-invoices.query';
import { ListInvoicesPresenter } from './list-invoices.presenter';

@ApiTags('invoices')
@Controller('v1/invoices')
@RequirePermission('platform.admin')
export class ListInvoicesRoute {
  constructor(private readonly listInvoices: ListInvoicesUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Listar faturas' })
  async handle(@Query() query: ListInvoicesQueryDto) {
    // If status is passed as a string but class-validator / query transformer didn't make it an array,
    // ensure it is processed as an array.
    const statusArray = query.status
      ? Array.isArray(query.status)
        ? query.status
        : [query.status]
      : undefined;

    const methodArray = query.method
      ? Array.isArray(query.method)
        ? query.method
        : [query.method]
      : undefined;

    const result = await this.listInvoices.execute({
      page: query.page,
      perPage: query.perPage,
      storeId: query.storeId,
      subscriptionId: query.subscriptionId,
      status: statusArray,
      method: methodArray,
      search: query.search,
      dueDateFrom: query.dueDateFrom,
      dueDateTo: query.dueDateTo,
    });
    return ListInvoicesPresenter.toHttp(result);
  }
}
