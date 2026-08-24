import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeletePatientContractEmissionUseCase } from '../../../../application/use-cases/delete-patient-contract-emission/delete-patient-contract-emission.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';

@ApiTags('patient-contract-emissions')
@Controller('v1/patients/:patientId/contracts')
@RequirePermission('manage', 'PatientDocument')
export class DeletePatientContractEmissionRoute {
  constructor(
    private readonly deletePatientContractEmission: DeletePatientContractEmissionUseCase,
  ) {}

  @Delete(':contractId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir contrato emitido do paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('contractId') contractId: string,
  ) {
    await this.deletePatientContractEmission.execute({
      storeId,
      patientId,
      contractId,
    });
  }
}
