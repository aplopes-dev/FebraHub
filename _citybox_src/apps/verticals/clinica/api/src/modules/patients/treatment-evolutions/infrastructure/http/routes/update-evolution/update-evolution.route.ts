import { Body, Controller, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateTreatmentEvolutionUseCase } from '../../../../application/use-cases/update-evolution/update-evolution.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { UpdateTreatmentEvolutionBodyDto } from '../shared/treatment-evolution.dto';
import { toTreatmentEvolutionResponse } from '../shared/treatment-evolution-response.mapper';

@ApiTags('treatment-evolutions')
@Controller('v1/patients/:patientId/evolutions')
@RequirePermission('update', 'PatientEvolution')
export class UpdateTreatmentEvolutionRoute {
  constructor(
    private readonly updateEvolution: UpdateTreatmentEvolutionUseCase,
  ) {}

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar evolução avulsa do paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTreatmentEvolutionBodyDto,
  ) {
    const evolution = await this.updateEvolution.execute({
      storeId,
      patientId,
      id,
      professionalId: dto.professionalId,
      professionalName: dto.professionalName,
      finalizedAt: new Date(dto.finalizedAt),
      evolutionNotes: dto.evolutionNotes,
    });
    return { data: toTreatmentEvolutionResponse(evolution) };
  }
}
