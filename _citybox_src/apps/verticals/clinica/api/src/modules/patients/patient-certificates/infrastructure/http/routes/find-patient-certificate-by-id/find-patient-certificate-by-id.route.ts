import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FindPatientCertificateByIdUseCase } from '../../../../application/use-cases/find-patient-certificate-by-id/find-patient-certificate-by-id.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { toPatientCertificateResponse } from '../shared/patient-certificate-response.mapper';

@ApiTags('patient-certificates')
@Controller('v1/patients/:patientId/certificates')
@RequirePermission('create', 'PatientCertificate')
export class FindPatientCertificateByIdRoute {
  constructor(
    private readonly findPatientCertificateById: FindPatientCertificateByIdUseCase,
  ) {}

  @Get(':certificateId')
  @ApiOperation({ summary: 'Detalhe do atestado do paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('certificateId') certificateId: string,
  ) {
    const certificate = await this.findPatientCertificateById.execute({
      storeId,
      patientId,
      certificateId,
    });
    return { data: toPatientCertificateResponse(certificate) };
  }
}
