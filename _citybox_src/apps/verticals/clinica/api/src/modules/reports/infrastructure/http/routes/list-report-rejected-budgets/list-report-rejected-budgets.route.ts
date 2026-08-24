import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListReportRejectedBudgetsUseCase } from '../../../../application/use-cases/list-report-rejected-budgets/list-report-rejected-budgets.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ListReportRejectedBudgetsQueryDto } from './list-report-rejected-budgets.query.dto';

@ApiTags('reports')
@Controller('v1/reports')
@RequirePermission('read', 'Dashboard')
export class ListReportRejectedBudgetsRoute {
  constructor(
    private readonly listReportRejectedBudgets: ListReportRejectedBudgetsUseCase,
  ) {}

  @Get('rejected-budgets')
  @ApiOperation({
    summary: 'Relatório: orçamentos reprovados no período (por rejectedAt)',
  })
  async handle(
    @StoreId() storeId: string,
    @Query() query: ListReportRejectedBudgetsQueryDto,
  ) {
    const result = await this.listReportRejectedBudgets.execute({
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
