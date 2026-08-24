import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetDashboardPatientAcquisitionUseCase } from '../../../../application/use-cases/get-dashboard-patient-acquisition/get-dashboard-patient-acquisition.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { GetDashboardPatientAcquisitionQueryDto } from './get-dashboard-patient-acquisition.query.dto';

@ApiTags('dashboard')
@Controller('v1/dashboard')
@RequirePermission('read', 'Dashboard')
export class GetDashboardPatientAcquisitionRoute {
  constructor(
    private readonly getDashboardPatientAcquisition: GetDashboardPatientAcquisitionUseCase,
  ) {}

  @Get('patient-acquisition')
  @ApiOperation({
    summary:
      'Agregar origem de cadastro dos pacientes (Como o paciente chegou na clínica)',
  })
  async handle(
    @StoreId() storeId: string,
    @Query() query: GetDashboardPatientAcquisitionQueryDto,
  ) {
    const result = await this.getDashboardPatientAcquisition.execute({
      storeId,
      periodMode: query.periodMode,
      year: query.year,
      month: query.month,
    });

    return { data: result };
  }
}
