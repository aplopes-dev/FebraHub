import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeletePatientExternalProfessionalUseCase } from '../../../../application/use-cases/delete-patient-external-professional/delete-patient-external-professional.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';

@ApiTags('patient-external-professionals')
@Controller('v1/patient-external-professionals')
@RequirePermission('manage', 'Patient')
export class DeletePatientExternalProfessionalRoute {
  constructor(
    private readonly deleteProfessional: DeletePatientExternalProfessionalUseCase,
  ) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir profissional externo indicador' })
  async handle(@StoreId() storeId: string, @Param('id') id: string) {
    await this.deleteProfessional.execute({ storeId, id });
  }
}
