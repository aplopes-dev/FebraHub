import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeletePatientFinancialEntryUseCase } from '../../../../application/use-cases/delete-patient-financial-entry/delete-patient-financial-entry.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';

@ApiTags('patient-financial-entries')
@Controller('v1/patients/:patientId/financial-entries')
@RequirePermission('manage', 'Patient')
export class DeletePatientFinancialEntryRoute {
  constructor(
    private readonly deletePatientFinancialEntry: DeletePatientFinancialEntryUseCase,
  ) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir lançamento financeiro do paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('id') entryId: string,
  ): Promise<void> {
    await this.deletePatientFinancialEntry.execute({
      storeId,
      patientId,
      entryId,
    });
  }
}
