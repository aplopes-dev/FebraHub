import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListReportSalesByPlanUseCase } from '../../../../application/use-cases/list-report-sales-by-plan/list-report-sales-by-plan.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ListReportSalesByPlanQueryDto } from './list-report-sales-by-plan.query.dto';

@ApiTags('reports')
@Controller('v1/reports')
@RequirePermission('read', 'Dashboard')
export class ListReportSalesByPlanRoute {
  constructor(
    private readonly listReportSalesByPlan: ListReportSalesByPlanUseCase,
  ) {}

  @Get('sales-by-plan')
  @ApiOperation({
    summary: 'Relatório: vendas por plano (itens de orçamentos aprovados)',
  })
  async handle(
    @StoreId() storeId: string,
    @Query() query: ListReportSalesByPlanQueryDto,
  ) {
    const result = await this.listReportSalesByPlan.execute({
      storeId,
      startDate: query.startDate,
      endDate: query.endDate,
      page: query.page,
      perPage: query.perPage,
    });

    return {
      data: result.items,
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }
}
