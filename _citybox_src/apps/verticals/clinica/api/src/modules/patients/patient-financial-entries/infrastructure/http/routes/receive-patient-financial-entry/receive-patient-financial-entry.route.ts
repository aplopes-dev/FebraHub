import { Body, Controller, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReceivePatientFinancialEntryUseCase } from '../../../../application/use-cases/receive-patient-financial-entry/receive-patient-financial-entry.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ReceivePatientFinancialEntryBodyDto } from '../shared/patient-financial-entry-body.dto';
import {
  toPatientFinancialEntryDetailResponse,
  toReceiveFinancialEntryInput,
} from '../shared/patient-financial-entry-response.mapper';

@ApiTags('patient-financial-entries')
@Controller('v1/patients/:patientId/financial-entries')
@RequirePermission('manage', 'Patient')
export class ReceivePatientFinancialEntryRoute {
  constructor(
    private readonly receivePatientFinancialEntry: ReceivePatientFinancialEntryUseCase,
  ) {}

  @Patch(':id/receive')
  @ApiOperation({ summary: 'Registrar recebimento de lançamento financeiro' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('id') entryId: string,
    @Body() body: ReceivePatientFinancialEntryBodyDto,
  ) {
    const entry = await this.receivePatientFinancialEntry.execute({
      storeId,
      patientId,
      entryId,
      input: toReceiveFinancialEntryInput(body),
    });

    return { data: toPatientFinancialEntryDetailResponse(entry) };
  }
}
