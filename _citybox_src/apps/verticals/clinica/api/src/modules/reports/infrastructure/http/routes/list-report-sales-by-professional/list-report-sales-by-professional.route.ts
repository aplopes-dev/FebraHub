import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListReportSalesByProfessionalUseCase } from '../../../../application/use-cases/list-report-sales-by-professional/list-report-sales-by-professional.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ListReportSalesByProfessionalQueryDto } from './list-report-sales-by-professional.query.dto';

@ApiTags('reports')
@Controller('v1/reports')
@RequirePermission('read', 'Dashboard')
export class ListReportSalesByProfessionalRoute {
  constructor(
    private readonly listReportSalesByProfessional: ListReportSalesByProfessionalUseCase,
  ) {}

  @Get('sales-by-professional')
  @ApiOperation({
    summary:
      'Relatório: vendas por profissional (itens de orçamentos aprovados)',
  })
  async handle(
    @StoreId() storeId: string,
    @Query() query: ListReportSalesByProfessionalQueryDto,
  ) {
    const result = await this.listReportSalesByProfessional.execute({
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
