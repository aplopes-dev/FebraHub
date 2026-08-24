import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InitializePatientNutritionUseCase } from '../../../../application/use-cases/initialize-nutrition/initialize-patient-nutrition.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { InitializePatientNutritionBodyDto } from '../shared/patient-treatment.dto';
import { toPatientNutritionInitiationResponse } from '../shared/patient-nutrition-initiation-response.mapper';

@ApiTags('patient-treatments')
@Controller('v1/patients/:patientId/treatments')
@RequirePermission('manage', 'PatientTreatment')
export class InitializePatientNutritionRoute {
  constructor(
    private readonly initializeNutrition: InitializePatientNutritionUseCase,
  ) {}

  @Post(':id/nutrition-init')
  @ApiOperation({
    summary:
      'Inicializar acompanhamento nutricional (Anamnese/Corporal/Plano → card na evolução)',
  })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('id') id: string,
    @Body() dto: InitializePatientNutritionBodyDto,
  ) {
    const initiation = await this.initializeNutrition.execute({
      storeId,
      patientId,
      treatmentId: id,
      professionalId: dto.professionalId,
      professionalName: dto.professionalName,
      initiatedAt: new Date(dto.initiatedAt),
      anamnesis: dto.anamnesis,
      body: dto.body,
      treatmentPlan: dto.treatmentPlan,
    });
    return { data: toPatientNutritionInitiationResponse(initiation) };
  }
}
