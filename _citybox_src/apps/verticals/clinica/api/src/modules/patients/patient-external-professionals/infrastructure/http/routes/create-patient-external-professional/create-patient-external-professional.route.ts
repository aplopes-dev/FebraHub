import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreatePatientExternalProfessionalUseCase } from '../../../../application/use-cases/create-patient-external-professional/create-patient-external-professional.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { CreatePatientExternalProfessionalBodyDto } from '../shared/patient-external-professional.dto';
import { toPatientExternalProfessionalResponse } from '../shared/patient-external-professional-response.mapper';

@ApiTags('patient-external-professionals')
@Controller('v1/patient-external-professionals')
@RequirePermission('manage', 'Patient')
export class CreatePatientExternalProfessionalRoute {
  constructor(
    private readonly createProfessional: CreatePatientExternalProfessionalUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cadastrar profissional externo indicador' })
  async handle(
    @StoreId() storeId: string,
    @Body() dto: CreatePatientExternalProfessionalBodyDto,
  ) {
    const professional = await this.createProfessional.execute({
      storeId,
      name: dto.name,
      phone: dto.phone,
      cro: dto.cro,
    });
    return { data: toPatientExternalProfessionalResponse(professional) };
  }
}
