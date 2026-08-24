import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListPatientContractEmissionsUseCase } from '../../../../application/use-cases/list-patient-contract-emissions/list-patient-contract-emissions.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { toPatientContractEmissionSummaryResponse } from '../shared/patient-contract-emission-response.mapper';
import { ListPatientContractEmissionsQueryDto } from './list-patient-contract-emissions.query.dto';

@ApiTags('patient-contract-emissions')
@Controller('v1/patients/:patientId/contracts')
@RequirePermission('manage', 'PatientDocument')
export class ListPatientContractEmissionsRoute {
  constructor(
    private readonly listPatientContractEmissions: ListPatientContractEmissionsUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar contratos emitidos do paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Query() query: ListPatientContractEmissionsQueryDto,
  ) {
    const result = await this.listPatientContractEmissions.execute({
      storeId,
      patientId,
      ...query,
    });

    return {
      data: result.items.map(toPatientContractEmissionSummaryResponse),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }
}
