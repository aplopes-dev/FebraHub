import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListReportExcludedRevenuesUseCase } from '../../../../application/use-cases/list-report-excluded-revenues/list-report-excluded-revenues.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ListReportExcludedRevenuesQueryDto } from './list-report-excluded-revenues.query.dto';

@ApiTags('reports')
@Controller('v1/reports')
@RequirePermission('read', 'Dashboard')
export class ListReportExcludedRevenuesRoute {
  constructor(
    private readonly listReportExcludedRevenues: ListReportExcludedRevenuesUseCase,
  ) {}

  @Get('excluded-revenues')
  @ApiOperation({
    summary: 'Relatório: receitas canceladas/excluídas no período',
  })
  async handle(
    @StoreId() storeId: string,
    @Query() query: ListReportExcludedRevenuesQueryDto,
  ) {
    const result = await this.listReportExcludedRevenues.execute({
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
