import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListTreatmentEvolutionsUseCase } from '../../../../application/use-cases/list-evolutions/list-evolutions.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { toTreatmentEvolutionResponse } from '../shared/treatment-evolution-response.mapper';

@ApiTags('treatment-evolutions')
@Controller('v1/patients/:patientId/evolutions')
@RequirePermission('manage', 'PatientTreatment')
export class ListTreatmentEvolutionsRoute {
  constructor(
    private readonly listEvolutions: ListTreatmentEvolutionsUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar evoluções do paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
  ) {
    const evolutions = await this.listEvolutions.execute({
      storeId,
      patientId,
    });
    return { data: evolutions.map(toTreatmentEvolutionResponse) };
  }
}
