import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListPatientCertificatesUseCase } from '../../../../application/use-cases/list-patient-certificates/list-patient-certificates.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { toPatientCertificateResponse } from '../shared/patient-certificate-response.mapper';
import { ListPatientCertificatesQueryDto } from './list-patient-certificates.query.dto';

@ApiTags('patient-certificates')
@Controller('v1/patients/:patientId/certificates')
@RequirePermission('create', 'PatientCertificate')
export class ListPatientCertificatesRoute {
  constructor(
    private readonly listPatientCertificates: ListPatientCertificatesUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar atestados do paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Query() query: ListPatientCertificatesQueryDto,
  ) {
    const result = await this.listPatientCertificates.execute({
      storeId,
      patientId,
      ...query,
    });

    return {
      data: result.items.map(toPatientCertificateResponse),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }
}
