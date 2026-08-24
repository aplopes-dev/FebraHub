import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeleteTreatmentEvolutionUseCase } from '../../../../application/use-cases/delete-evolution/delete-evolution.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';

@ApiTags('treatment-evolutions')
@Controller('v1/patients/:patientId/evolutions')
@RequirePermission('delete', 'PatientEvolution')
export class DeleteTreatmentEvolutionRoute {
  constructor(
    private readonly deleteEvolution: DeleteTreatmentEvolutionUseCase,
  ) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir evolução do paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('id') id: string,
  ) {
    await this.deleteEvolution.execute({ storeId, patientId, id });
  }
}
