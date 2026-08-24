import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreatePatientFinancialEntryUseCase } from '../../../../application/use-cases/create-patient-financial-entry/create-patient-financial-entry.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { PatientFinancialAvulsoDebitBodyDto } from '../shared/patient-financial-entry-body.dto';
import {
  toPatientFinancialEntryDetailResponse,
  toAvulsoDebitInput,
} from '../shared/patient-financial-entry-response.mapper';

@ApiTags('patient-financial-entries')
@Controller('v1/patients/:patientId/financial-entries')
@RequirePermission('manage', 'Patient')
export class CreatePatientFinancialEntryRoute {
  constructor(
    private readonly createPatientFinancialEntry: CreatePatientFinancialEntryUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar débito avulso do paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Body() body: PatientFinancialAvulsoDebitBodyDto,
  ) {
    const entry = await this.createPatientFinancialEntry.execute({
      storeId,
      patientId,
      input: toAvulsoDebitInput(body),
    });

    return { data: toPatientFinancialEntryDetailResponse(entry) };
  }
}
