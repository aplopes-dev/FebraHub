import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FindPatientFinancialEntryByIdUseCase } from '../../../../application/use-cases/find-patient-financial-entry-by-id/find-patient-financial-entry-by-id.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { toPatientFinancialEntryDetailResponse } from '../shared/patient-financial-entry-response.mapper';

@ApiTags('patient-financial-entries')
@Controller('v1/patients/:patientId/financial-entries')
@RequirePermission('manage', 'Patient')
export class FindPatientFinancialEntryByIdRoute {
  constructor(
    private readonly findPatientFinancialEntryById: FindPatientFinancialEntryByIdUseCase,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Detalhar lançamento financeiro do paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('id') entryId: string,
  ) {
    const entry = await this.findPatientFinancialEntryById.execute({
      storeId,
      patientId,
      entryId,
    });

    return { data: toPatientFinancialEntryDetailResponse(entry) };
  }
}
