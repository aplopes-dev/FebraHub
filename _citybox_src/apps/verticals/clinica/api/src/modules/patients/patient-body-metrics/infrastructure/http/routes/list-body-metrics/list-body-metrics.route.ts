import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListPatientBodyMetricsUseCase } from '../../../../application/use-cases/list-body-metrics/list-body-metrics.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { toPatientBodyMetricResponse } from '../shared/patient-body-metric-response.mapper';
import { ListPatientBodyMetricsQueryDto } from './list-body-metrics.query.dto';

@ApiTags('patient-body-metrics')
@Controller('v1/patients/:patientId/body-metrics')
@RequirePermission('manage', 'Patient')
export class ListPatientBodyMetricsRoute {
  constructor(
    private readonly listBodyMetrics: ListPatientBodyMetricsUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar medições corporais do paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Query() query: ListPatientBodyMetricsQueryDto,
  ) {
    const result = await this.listBodyMetrics.execute({
      storeId,
      patientId,
      ...query,
    });

    return {
      data: result.items.map(toPatientBodyMetricResponse),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }
}
