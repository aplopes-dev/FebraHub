import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListPatientTreatmentsUseCase } from '../../../../application/use-cases/list-treatments/list-treatments.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { toPatientTreatmentResponse } from '../shared/patient-treatment-response.mapper';

@ApiTags('patient-treatments')
@Controller('v1/patients/:patientId/treatments')
@RequirePermission('manage', 'PatientTreatment')
export class ListPatientTreatmentsRoute {
  constructor(private readonly listTreatments: ListPatientTreatmentsUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Listar procedimentos do paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
  ) {
    const treatments = await this.listTreatments.execute({
      storeId,
      patientId,
    });
    return { data: treatments.map(toPatientTreatmentResponse) };
  }
}
