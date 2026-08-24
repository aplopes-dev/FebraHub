import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreatePatientCertificateUseCase } from '../../../../application/use-cases/create-patient-certificate/create-patient-certificate.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { CreatePatientCertificateBodyDto } from '../shared/patient-certificate-body.dto';
import { toPatientCertificateResponse } from '../shared/patient-certificate-response.mapper';

@ApiTags('patient-certificates')
@Controller('v1/patients/:patientId/certificates')
@RequirePermission('create', 'PatientCertificate')
export class CreatePatientCertificateRoute {
  constructor(
    private readonly createPatientCertificate: CreatePatientCertificateUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Emitir atestado do paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Body() body: CreatePatientCertificateBodyDto,
  ) {
    const certificate = await this.createPatientCertificate.execute({
      storeId,
      patientId,
      input: body,
    });
    return { data: toPatientCertificateResponse(certificate) };
  }
}
