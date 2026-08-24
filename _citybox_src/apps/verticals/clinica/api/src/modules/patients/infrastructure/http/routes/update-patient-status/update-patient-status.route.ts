import { Body, Controller, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdatePatientStatusUseCase } from '../../../../application/use-cases/update-patient-status/update-patient-status.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { UpdatePatientStatusBodyDto } from '../shared/patient-body.dto';
import { toPatientResponse } from '../shared/patient-response.mapper';

@ApiTags('patients')
@Controller('v1/patients')
@RequirePermission('delete', 'Patient')
export class UpdatePatientStatusRoute {
  constructor(private readonly updateStatus: UpdatePatientStatusUseCase) {}

  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualizar status do paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePatientStatusBodyDto,
  ) {
    const detail = await this.updateStatus.execute({
      storeId,
      id,
      status: dto.status,
    });
    return { data: toPatientResponse(detail) };
  }
}
