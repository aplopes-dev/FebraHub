import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListDashboardPatientAcquisitionDetailsUseCase } from '../../../../application/use-cases/list-dashboard-patient-acquisition-details/list-dashboard-patient-acquisition-details.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ListDashboardPatientAcquisitionDetailsQueryDto } from './list-dashboard-patient-acquisition-details.query.dto';

@ApiTags('dashboard')
@Controller('v1/dashboard')
@RequirePermission('read', 'Dashboard')
export class ListDashboardPatientAcquisitionDetailsRoute {
  constructor(
    private readonly listDashboardPatientAcquisitionDetails: ListDashboardPatientAcquisitionDetailsUseCase,
  ) {}

  @Get('patient-acquisition/details')
  @ApiOperation({
    summary:
      'Detalhe paginado de pacientes por origem de cadastro (dashboard)',
  })
  async handle(
    @StoreId() storeId: string,
    @Query() query: ListDashboardPatientAcquisitionDetailsQueryDto,
  ) {
    const result = await this.listDashboardPatientAcquisitionDetails.execute({
      storeId,
      source: query.source,
      periodMode: query.periodMode,
      year: query.year,
      month: query.month,
      page: query.page,
      perPage: query.perPage,
      search: query.search,
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
