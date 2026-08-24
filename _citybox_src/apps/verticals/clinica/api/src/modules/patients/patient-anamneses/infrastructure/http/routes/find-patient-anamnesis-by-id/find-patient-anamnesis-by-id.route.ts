import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FindPatientAnamnesisByIdUseCase } from '../../../../application/use-cases/find-patient-anamnesis-by-id/find-patient-anamnesis-by-id.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { toPatientAnamnesisDetailResponse } from '../shared/patient-anamnesis-response.mapper';

@ApiTags('patient-anamneses')
@Controller('v1/patients/:patientId/anamneses')
@RequirePermission('manage', 'PatientAnamnesis')
export class FindPatientAnamnesisByIdRoute {
  constructor(
    private readonly findPatientAnamnesisById: FindPatientAnamnesisByIdUseCase,
  ) {}

  @Get(':anamnesisId')
  @ApiOperation({ summary: 'Detalhe da anamnese do paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('anamnesisId') anamnesisId: string,
  ) {
    const anamnesis = await this.findPatientAnamnesisById.execute({
      storeId,
      patientId,
      anamnesisId,
    });
    return { data: toPatientAnamnesisDetailResponse(anamnesis) };
  }
}
