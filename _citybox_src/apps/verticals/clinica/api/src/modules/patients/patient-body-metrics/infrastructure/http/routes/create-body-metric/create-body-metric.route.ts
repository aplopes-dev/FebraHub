import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreatePatientBodyMetricUseCase } from '../../../../application/use-cases/create-body-metric/create-body-metric.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { UpsertPatientBodyMetricBodyDto } from '../shared/patient-body-metric.http-dto';
import { toPatientBodyMetricResponse } from '../shared/patient-body-metric-response.mapper';

@ApiTags('patient-body-metrics')
@Controller('v1/patients/:patientId/body-metrics')
@RequirePermission('manage', 'Patient')
export class CreatePatientBodyMetricRoute {
  constructor(
    private readonly createBodyMetric: CreatePatientBodyMetricUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar medição corporal do paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Body() body: UpsertPatientBodyMetricBodyDto,
  ) {
    const metric = await this.createBodyMetric.execute({
      storeId,
      patientId,
      input: body,
    });
    return { data: toPatientBodyMetricResponse(metric) };
  }
}
