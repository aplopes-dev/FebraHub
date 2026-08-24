import { Body, Controller, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReorderPatientTreatmentsUseCase } from '../../../../application/use-cases/reorder-treatments/reorder-treatments.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ReorderPatientTreatmentsBodyDto } from '../shared/patient-treatment.dto';
import { toPatientTreatmentResponse } from '../shared/patient-treatment-response.mapper';

@ApiTags('patient-treatments')
@Controller('v1/patients/:patientId/treatments')
@RequirePermission('manage', 'PatientTreatment')
export class ReorderPatientTreatmentsRoute {
  constructor(
    private readonly reorderTreatments: ReorderPatientTreatmentsUseCase,
  ) {}

  @Patch('reorder')
  @ApiOperation({ summary: 'Reordenar procedimentos do paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Body() dto: ReorderPatientTreatmentsBodyDto,
  ) {
    const treatments = await this.reorderTreatments.execute({
      storeId,
      patientId,
      orderedIds: dto.orderedIds,
    });
    return { data: treatments.map(toPatientTreatmentResponse) };
  }
}
