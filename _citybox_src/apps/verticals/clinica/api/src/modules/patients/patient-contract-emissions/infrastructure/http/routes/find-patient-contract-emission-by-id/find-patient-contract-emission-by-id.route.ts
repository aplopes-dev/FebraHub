import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FindPatientContractEmissionByIdUseCase } from '../../../../application/use-cases/find-patient-contract-emission-by-id/find-patient-contract-emission-by-id.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { toPatientContractEmissionDetailResponse } from '../shared/patient-contract-emission-response.mapper';

@ApiTags('patient-contract-emissions')
@Controller('v1/patients/:patientId/contracts')
@RequirePermission('manage', 'PatientDocument')
export class FindPatientContractEmissionByIdRoute {
  constructor(
    private readonly findPatientContractEmissionById: FindPatientContractEmissionByIdUseCase,
  ) {}

  @Get(':contractId')
  @ApiOperation({ summary: 'Detalhar contrato emitido do paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('contractId') contractId: string,
  ) {
    const emission = await this.findPatientContractEmissionById.execute({
      storeId,
      patientId,
      contractId,
    });
    return { data: toPatientContractEmissionDetailResponse(emission) };
  }
}
