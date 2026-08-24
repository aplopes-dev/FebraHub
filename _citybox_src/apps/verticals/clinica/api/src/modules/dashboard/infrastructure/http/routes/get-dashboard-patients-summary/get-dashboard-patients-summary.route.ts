import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetDashboardPatientsSummaryUseCase } from '../../../../application/use-cases/get-dashboard-patients-summary/get-dashboard-patients-summary.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';

@ApiTags('dashboard')
@Controller('v1/dashboard')
@RequirePermission('read', 'Dashboard')
export class GetDashboardPatientsSummaryRoute {
  constructor(
    private readonly getDashboardPatientsSummary: GetDashboardPatientsSummaryUseCase,
  ) {}

  @Get('patients/summary')
  @ApiOperation({
    summary:
      'Resumo de métricas de pacientes do dashboard (5 contagens; aniversariantes ficam em /summary)',
  })
  async handle(@StoreId() storeId: string) {
    const result = await this.getDashboardPatientsSummary.execute({ storeId });
    return { data: result };
  }
}
