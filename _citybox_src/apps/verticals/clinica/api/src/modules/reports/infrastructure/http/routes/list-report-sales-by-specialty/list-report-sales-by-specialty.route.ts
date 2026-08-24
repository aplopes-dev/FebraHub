import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListReportSalesBySpecialtyUseCase } from '../../../../application/use-cases/list-report-sales-by-specialty/list-report-sales-by-specialty.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ListReportSalesBySpecialtyQueryDto } from './list-report-sales-by-specialty.query.dto';

@ApiTags('reports')
@Controller('v1/reports')
@RequirePermission('read', 'Dashboard')
export class ListReportSalesBySpecialtyRoute {
  constructor(
    private readonly listReportSalesBySpecialty: ListReportSalesBySpecialtyUseCase,
  ) {}

  @Get('sales-by-specialty')
  @ApiOperation({
    summary:
      'Relatório: vendas por especialidade (itens de orçamentos aprovados)',
  })
  async handle(
    @StoreId() storeId: string,
    @Query() query: ListReportSalesBySpecialtyQueryDto,
  ) {
    const result = await this.listReportSalesBySpecialty.execute({
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
