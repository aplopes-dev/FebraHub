import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetPatientNutritionInitiationUseCase } from '../../../../application/use-cases/initialize-nutrition/get-patient-nutrition-initiation.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { toPatientNutritionInitiationResponse } from '../shared/patient-nutrition-initiation-response.mapper';

@ApiTags('patient-treatments')
@Controller('v1/patients/:patientId/nutrition-inits')
@RequirePermission('manage', 'PatientTreatment')
export class GetPatientNutritionInitiationRoute {
  constructor(
    private readonly getNutritionInitiation: GetPatientNutritionInitiationUseCase,
  ) {}

  @Get(':evolutionId')
  @ApiOperation({
    summary: 'Reabrir pacote de inicialização nutricional pela evolução',
  })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('evolutionId') evolutionId: string,
  ) {
    const initiation = await this.getNutritionInitiation.execute({
      storeId,
      patientId,
      evolutionId,
    });
    return { data: toPatientNutritionInitiationResponse(initiation) };
  }
}
