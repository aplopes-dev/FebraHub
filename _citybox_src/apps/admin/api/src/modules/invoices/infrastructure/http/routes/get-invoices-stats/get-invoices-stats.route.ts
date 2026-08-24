import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetInvoicesStatsUseCase } from '../../../../application/use-cases/get-invoices-stats/get-invoices-stats.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { GetInvoicesStatsQueryDto } from './get-invoices-stats.query';
import { GetInvoicesStatsPresenter } from './get-invoices-stats.presenter';

@ApiTags('invoices')
@Controller('v1/invoices/stats')
@RequirePermission('platform.admin')
export class GetInvoicesStatsRoute {
  constructor(private readonly getInvoicesStats: GetInvoicesStatsUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Obter estatísticas de faturas' })
  async handle(@Query() query: GetInvoicesStatsQueryDto) {
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

    const result = await this.getInvoicesStats.execute({
      storeId: query.storeId,
      subscriptionId: query.subscriptionId,
      status: statusArray,
      method: methodArray,
      search: query.search,
      dueDateFrom: query.dueDateFrom,
      dueDateTo: query.dueDateTo,
    });
    return GetInvoicesStatsPresenter.toHttp(result);
  }
}
