import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetDashboardPatientDemographicsUseCase } from '../../../../application/use-cases/get-dashboard-patient-demographics/get-dashboard-patient-demographics.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { GetDashboardPatientDemographicsQueryDto } from './get-dashboard-patient-demographics.query.dto';

@ApiTags('dashboard')
@Controller('v1/dashboard')
@RequirePermission('read', 'Dashboard')
export class GetDashboardPatientDemographicsRoute {
  constructor(
    private readonly getDashboardPatientDemographics: GetDashboardPatientDemographicsUseCase,
  ) {}

  @Get('patient-demographics')
  @ApiOperation({
    summary: 'Agregar pacientes por idade e sexo (dashboard)',
  })
  async handle(
    @StoreId() storeId: string,
    @Query() query: GetDashboardPatientDemographicsQueryDto,
  ) {
    const result = await this.getDashboardPatientDemographics.execute({
      storeId,
      gender: query.gender,
    });

    return { data: result };
  }
}
