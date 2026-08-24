import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreatePatientTreatmentUseCase } from '../../../../application/use-cases/create-treatment/create-treatment.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { CreatePatientTreatmentBodyDto } from '../shared/patient-treatment.dto';
import { toPatientTreatmentResponse } from '../shared/patient-treatment-response.mapper';

@ApiTags('patient-treatments')
@Controller('v1/patients/:patientId/treatments')
@RequirePermission('manage', 'PatientTreatment')
export class CreatePatientTreatmentRoute {
  constructor(
    private readonly createTreatment: CreatePatientTreatmentUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar procedimento avulso do paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Body() dto: CreatePatientTreatmentBodyDto,
  ) {
    const treatment = await this.createTreatment.execute({
      storeId,
      patientId,
      ...dto,
    });
    return { data: toPatientTreatmentResponse(treatment) };
  }
}
