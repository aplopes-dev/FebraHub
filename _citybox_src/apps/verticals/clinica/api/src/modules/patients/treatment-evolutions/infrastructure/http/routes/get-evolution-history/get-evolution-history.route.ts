import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetEvolutionHistoryUseCase } from '../../../../application/use-cases/get-evolution-history/get-evolution-history.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { toEvolutionHistoryResponse } from '../shared/treatment-evolution-response.mapper';

@ApiTags('treatment-evolutions')
@Controller('v1/patients/:patientId/evolutions')
@RequirePermission('manage', 'PatientTreatment')
export class GetEvolutionHistoryRoute {
  constructor(private readonly getHistory: GetEvolutionHistoryUseCase) {}

  @Get(':id/history')
  @ApiOperation({ summary: 'Obter histórico de ações da evolução' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('id') id: string,
  ) {
    const history = await this.getHistory.execute({ storeId, patientId, id });
    return { data: history.map(toEvolutionHistoryResponse) };
  }
}
