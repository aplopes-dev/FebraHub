import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListReportBirthdaysUseCase } from '../../../../application/use-cases/list-report-birthdays/list-report-birthdays.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ListReportBirthdaysQueryDto } from './list-report-birthdays.query.dto';

@ApiTags('reports')
@Controller('v1/reports')
@RequirePermission('read', 'Dashboard')
export class ListReportBirthdaysRoute {
  constructor(
    private readonly listReportBirthdays: ListReportBirthdaysUseCase,
  ) {}

  @Get('birthdays')
  @ApiOperation({ summary: 'Relatório de aniversariantes no período' })
  async handle(
    @StoreId() storeId: string,
    @Query() query: ListReportBirthdaysQueryDto,
  ) {
    const result = await this.listReportBirthdays.execute({
      storeId,
      startDate: query.startDate,
      endDate: query.endDate,
      page: query.page,
      perPage: query.perPage,
      status: query.status,
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
