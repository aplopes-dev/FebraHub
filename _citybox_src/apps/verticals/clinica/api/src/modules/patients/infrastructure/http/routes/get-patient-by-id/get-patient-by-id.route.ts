import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FindPatientByIdUseCase } from '../../../../application/use-cases/find-patient-by-id/find-patient-by-id.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { toPatientFormResponse } from '../shared/patient-response.mapper';

@ApiTags('patients')
@Controller('v1/patients')
@RequirePermission('read', 'Patient')
export class GetPatientByIdRoute {
  constructor(private readonly findPatient: FindPatientByIdUseCase) {}

  @Get(':id')
  @ApiOperation({ summary: 'Obter paciente por id' })
  async handle(@StoreId() storeId: string, @Param('id') id: string) {
    const detail = await this.findPatient.execute({ storeId, id });
    return { data: toPatientFormResponse(detail) };
  }
}
