import { Body, Controller, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdatePatientContractEmissionUseCase } from '../../../../application/use-cases/update-patient-contract-emission/update-patient-contract-emission.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { UpsertPatientContractEmissionBodyDto } from '../shared/patient-contract-emission-body.dto';
import { toPatientContractEmissionDetailResponse } from '../shared/patient-contract-emission-response.mapper';

@ApiTags('patient-contract-emissions')
@Controller('v1/patients/:patientId/contracts')
@RequirePermission('manage', 'PatientDocument')
export class UpdatePatientContractEmissionRoute {
  constructor(
    private readonly updatePatientContractEmission: UpdatePatientContractEmissionUseCase,
  ) {}

  @Put(':contractId')
  @ApiOperation({ summary: 'Atualizar contrato emitido do paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('contractId') contractId: string,
    @Body() body: UpsertPatientContractEmissionBodyDto,
  ) {
    const emission = await this.updatePatientContractEmission.execute({
      storeId,
      patientId,
      contractId,
      input: body,
    });
    return { data: toPatientContractEmissionDetailResponse(emission) };
  }
}
