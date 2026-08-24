import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListPatientAnamnesesUseCase } from '../../../../application/use-cases/list-patient-anamneses/list-patient-anamneses.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { toPatientAnamnesisSummaryResponse } from '../shared/patient-anamnesis-response.mapper';
import { ListPatientAnamnesesQueryDto } from './list-patient-anamneses.query.dto';

@ApiTags('patient-anamneses')
@Controller('v1/patients/:patientId/anamneses')
@RequirePermission('manage', 'PatientAnamnesis')
export class ListPatientAnamnesesRoute {
  constructor(
    private readonly listPatientAnamneses: ListPatientAnamnesesUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar anamneses do paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Query() query: ListPatientAnamnesesQueryDto,
  ) {
    const result = await this.listPatientAnamneses.execute({
      storeId,
      patientId,
      ...query,
    });

    return {
      data: result.items.map(toPatientAnamnesisSummaryResponse),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }
}
