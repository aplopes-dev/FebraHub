import { Body, Controller, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FinalizePatientTreatmentUseCase } from '../../../../application/use-cases/finalize-treatment/finalize-treatment.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import {
  FinalizePatientTreatmentBatchBodyDto,
  FinalizePatientTreatmentBodyDto,
} from '../shared/patient-treatment.dto';
import { toPatientTreatmentResponse } from '../shared/patient-treatment-response.mapper';

@ApiTags('patient-treatments')
@Controller('v1/patients/:patientId/treatments')
@RequirePermission('manage', 'PatientTreatment')
export class FinalizePatientTreatmentRoute {
  constructor(
    private readonly finalizeTreatment: FinalizePatientTreatmentUseCase,
  ) {}

  @Patch('finalize')
  @ApiOperation({
    summary:
      'Finalizar um ou mais procedimentos (uma evolução clínica compartilhada)',
  })
  async handleBatch(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Body() dto: FinalizePatientTreatmentBatchBodyDto,
  ) {
    const treatments = await this.finalizeTreatment.execute({
      storeId,
      patientId,
      ids: dto.treatmentIds,
      professionalId: dto.professionalId,
      professionalName: dto.professionalName,
      finalizedAt: new Date(dto.finalizedAt),
      evolutionNotes: dto.evolutionNotes,
    });
    return { data: treatments.map(toPatientTreatmentResponse) };
  }

  @Patch(':id/finalize')
  @ApiOperation({
    summary: 'Finalizar procedimento do paciente (cria evolução vinculada)',
  })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('id') id: string,
    @Body() dto: FinalizePatientTreatmentBodyDto,
  ) {
    const treatments = await this.finalizeTreatment.execute({
      storeId,
      patientId,
      ids: [id],
      professionalId: dto.professionalId,
      professionalName: dto.professionalName,
      finalizedAt: new Date(dto.finalizedAt),
      evolutionNotes: dto.evolutionNotes,
    });
    return { data: toPatientTreatmentResponse(treatments[0]!) };
  }
}
