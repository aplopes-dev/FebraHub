import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListReportApprovedBudgetsUseCase } from '../../../../application/use-cases/list-report-approved-budgets/list-report-approved-budgets.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ListReportApprovedBudgetsQueryDto } from './list-report-approved-budgets.query.dto';

@ApiTags('reports')
@Controller('v1/reports')
@RequirePermission('read', 'Dashboard')
export class ListReportApprovedBudgetsRoute {
  constructor(
    private readonly listReportApprovedBudgets: ListReportApprovedBudgetsUseCase,
  ) {}

  @Get('approved-budgets')
  @ApiOperation({
    summary: 'Relatório: orçamentos aprovados no período (por approvedAt)',
  })
  async handle(
    @StoreId() storeId: string,
    @Query() query: ListReportApprovedBudgetsQueryDto,
  ) {
    const result = await this.listReportApprovedBudgets.execute({
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
