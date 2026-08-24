import { Body, Controller, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdatePatientFinancialEntryUseCase } from '../../../../application/use-cases/update-patient-financial-entry/update-patient-financial-entry.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { UpdatePatientFinancialEntryBodyDto } from '../shared/patient-financial-entry-body.dto';
import { toPatientFinancialEntryDetailResponse } from '../shared/patient-financial-entry-response.mapper';

@ApiTags('patient-financial-entries')
@Controller('v1/patients/:patientId/financial-entries')
@RequirePermission('manage', 'Patient')
export class UpdatePatientFinancialEntryRoute {
  constructor(
    private readonly updatePatientFinancialEntry: UpdatePatientFinancialEntryUseCase,
  ) {}

  @Put(':id')
  @ApiOperation({
    summary:
      'Atualizar débito pendente (avulso ou orçamento): observações, valor e dentista',
  })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('id') entryId: string,
    @Body() body: UpdatePatientFinancialEntryBodyDto,
  ) {
    const entry = await this.updatePatientFinancialEntry.execute({
      storeId,
      patientId,
      entryId,
      input: {
        observations: body.observations,
        ...(body.valueCents !== undefined
          ? { valueCents: body.valueCents }
          : {}),
        ...(body.treatments ? { treatments: body.treatments } : {}),
      },
    });

    return { data: toPatientFinancialEntryDetailResponse(entry) };
  }
}
