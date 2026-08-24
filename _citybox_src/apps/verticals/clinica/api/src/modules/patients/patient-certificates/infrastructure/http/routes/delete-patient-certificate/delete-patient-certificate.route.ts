import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeletePatientCertificateUseCase } from '../../../../application/use-cases/delete-patient-certificate/delete-patient-certificate.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';

@ApiTags('patient-certificates')
@Controller('v1/patients/:patientId/certificates')
@RequirePermission('create', 'PatientCertificate')
export class DeletePatientCertificateRoute {
  constructor(
    private readonly deletePatientCertificate: DeletePatientCertificateUseCase,
  ) {}

  @Delete(':certificateId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir atestado do paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('certificateId') certificateId: string,
  ) {
    await this.deletePatientCertificate.execute({
      storeId,
      patientId,
      certificateId,
    });
  }
}
