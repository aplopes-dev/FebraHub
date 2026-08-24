import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListPatientExternalProfessionalsUseCase } from '../../../../application/use-cases/list-patient-external-professionals/list-patient-external-professionals.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { toPatientExternalProfessionalResponse } from '../shared/patient-external-professional-response.mapper';

@ApiTags('patient-external-professionals')
@Controller('v1/patient-external-professionals')
@RequirePermission('manage', 'Patient')
export class ListPatientExternalProfessionalsRoute {
  constructor(
    private readonly listProfessionals: ListPatientExternalProfessionalsUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar profissionais externos indicadores' })
  async handle(@StoreId() storeId: string) {
    const professionals = await this.listProfessionals.execute({ storeId });
    return { data: professionals.map(toPatientExternalProfessionalResponse) };
  }
}
