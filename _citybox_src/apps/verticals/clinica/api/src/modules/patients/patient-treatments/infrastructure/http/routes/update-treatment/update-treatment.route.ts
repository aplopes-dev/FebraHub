import { Body, Controller, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdatePatientTreatmentUseCase } from '../../../../application/use-cases/update-treatment/update-treatment.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { UpdatePatientTreatmentBodyDto } from '../shared/patient-treatment.dto';
import { toPatientTreatmentResponse } from '../shared/patient-treatment-response.mapper';

@ApiTags('patient-treatments')
@Controller('v1/patients/:patientId/treatments')
@RequirePermission('manage', 'PatientTreatment')
export class UpdatePatientTreatmentRoute {
  constructor(
    private readonly updateTreatment: UpdatePatientTreatmentUseCase,
  ) {}

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar diagnóstico/observação do procedimento' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePatientTreatmentBodyDto,
  ) {
    const treatment = await this.updateTreatment.execute({
      storeId,
      patientId,
      id,
      ...dto,
    });
    return { data: toPatientTreatmentResponse(treatment) };
  }
}
