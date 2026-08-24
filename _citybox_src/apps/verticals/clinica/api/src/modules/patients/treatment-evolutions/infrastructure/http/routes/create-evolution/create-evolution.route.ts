import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateTreatmentEvolutionUseCase } from '../../../../application/use-cases/create-evolution/create-evolution.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { CreateStandaloneEvolutionBodyDto } from '../shared/treatment-evolution.dto';
import { toTreatmentEvolutionResponse } from '../shared/treatment-evolution-response.mapper';

@ApiTags('treatment-evolutions')
@Controller('v1/patients/:patientId/evolutions')
@RequirePermission('create', 'PatientEvolution')
export class CreateTreatmentEvolutionRoute {
  constructor(
    private readonly createEvolution: CreateTreatmentEvolutionUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar evolução avulsa do paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Body() dto: CreateStandaloneEvolutionBodyDto,
  ) {
    const evolution = await this.createEvolution.execute({
      storeId,
      patientId,
      professionalId: dto.professionalId,
      professionalName: dto.professionalName,
      finalizedAt: new Date(dto.finalizedAt),
      evolutionNotes: dto.evolutionNotes,
    });
    return { data: toTreatmentEvolutionResponse(evolution) };
  }
}
