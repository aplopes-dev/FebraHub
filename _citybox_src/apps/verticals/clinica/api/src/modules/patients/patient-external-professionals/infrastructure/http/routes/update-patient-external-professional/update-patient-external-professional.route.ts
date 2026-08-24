import { Body, Controller, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdatePatientExternalProfessionalUseCase } from '../../../../application/use-cases/update-patient-external-professional/update-patient-external-professional.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { CreatePatientExternalProfessionalBodyDto } from '../shared/patient-external-professional.dto';
import { toPatientExternalProfessionalResponse } from '../shared/patient-external-professional-response.mapper';

@ApiTags('patient-external-professionals')
@Controller('v1/patient-external-professionals')
@RequirePermission('manage', 'Patient')
export class UpdatePatientExternalProfessionalRoute {
  constructor(
    private readonly updateProfessional: UpdatePatientExternalProfessionalUseCase,
  ) {}

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar profissional externo indicador' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @Body() dto: CreatePatientExternalProfessionalBodyDto,
  ) {
    const professional = await this.updateProfessional.execute({
      storeId,
      id,
      name: dto.name,
      phone: dto.phone,
      cro: dto.cro,
    });
    return { data: toPatientExternalProfessionalResponse(professional) };
  }
}
