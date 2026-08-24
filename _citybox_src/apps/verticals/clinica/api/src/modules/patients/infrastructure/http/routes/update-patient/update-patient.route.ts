import { Body, Controller, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdatePatientUseCase } from '../../../../application/use-cases/update-patient/update-patient.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { UpsertPatientBodyDto } from '../shared/patient-body.dto';
import { toPatientFormResponse } from '../shared/patient-response.mapper';

@ApiTags('patients')
@Controller('v1/patients')
@RequirePermission('update', 'Patient')
export class UpdatePatientRoute {
  constructor(private readonly updatePatient: UpdatePatientUseCase) {}

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @Body() dto: UpsertPatientBodyDto,
  ) {
    const detail = await this.updatePatient.execute({
      storeId,
      id,
      input: dto,
    });
    return { data: toPatientFormResponse(detail) };
  }
}
