import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListReportSalesByTreatmentUseCase } from '../../../../application/use-cases/list-report-sales-by-treatment/list-report-sales-by-treatment.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ListReportSalesByTreatmentQueryDto } from './list-report-sales-by-treatment.query.dto';

@ApiTags('reports')
@Controller('v1/reports')
@RequirePermission('read', 'Dashboard')
export class ListReportSalesByTreatmentRoute {
  constructor(
    private readonly listReportSalesByTreatment: ListReportSalesByTreatmentUseCase,
  ) {}

  @Get('sales-by-treatment')
  @ApiOperation({
    summary: 'Relatório: vendas por procedimento (itens de orçamentos aprovados)',
  })
  async handle(
    @StoreId() storeId: string,
    @Query() query: ListReportSalesByTreatmentQueryDto,
  ) {
    const result = await this.listReportSalesByTreatment.execute({
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
