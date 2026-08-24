import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListPatientNutritionInitiationsUseCase } from '../../../../application/use-cases/initialize-nutrition/list-patient-nutrition-initiations.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { toPatientNutritionInitiationSummaryResponse } from '../shared/patient-nutrition-initiation-response.mapper';

@ApiTags('patient-treatments')
@Controller('v1/patients/:patientId/nutrition-inits')
@RequirePermission('manage', 'PatientTreatment')
export class ListPatientNutritionInitiationsRoute {
  constructor(
    private readonly listNutritionInitiations: ListPatientNutritionInitiationsUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'Listar metadados das inicializações nutricionais do paciente (card da evolução)',
  })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
  ) {
    const summaries = await this.listNutritionInitiations.execute({
      storeId,
      patientId,
    });
    return { data: summaries.map(toPatientNutritionInitiationSummaryResponse) };
  }
}
