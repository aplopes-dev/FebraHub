import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeletePatientAnamnesisUseCase } from '../../../../application/use-cases/delete-patient-anamnesis/delete-patient-anamnesis.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';

@ApiTags('patient-anamneses')
@Controller('v1/patients/:patientId/anamneses')
@RequirePermission('manage', 'PatientAnamnesis')
export class DeletePatientAnamnesisRoute {
  constructor(
    private readonly deletePatientAnamnesis: DeletePatientAnamnesisUseCase,
  ) {}

  @Delete(':anamnesisId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir anamnese do paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('anamnesisId') anamnesisId: string,
  ) {
    await this.deletePatientAnamnesis.execute({
      storeId,
      patientId,
      anamnesisId,
    });
  }
}
