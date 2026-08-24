import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListReportReferredPatientsUseCase } from '../../../../application/use-cases/list-report-referred-patients/list-report-referred-patients.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ListReportReferredPatientsQueryDto } from './list-report-referred-patients.query.dto';

@ApiTags('reports')
@Controller('v1/reports')
@RequirePermission('read', 'Dashboard')
export class ListReportReferredPatientsRoute {
  constructor(
    private readonly listReportReferredPatients: ListReportReferredPatientsUseCase,
  ) {}

  @Get('referred-patients')
  @ApiOperation({
    summary: 'Relatório: pacientes com origem indicação no período de cadastro',
  })
  async handle(
    @StoreId() storeId: string,
    @Query() query: ListReportReferredPatientsQueryDto,
  ) {
    const result = await this.listReportReferredPatients.execute({
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
