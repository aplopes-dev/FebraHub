import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { ListCertificatesUseCase } from '../../../../application/use-cases/list-certificates/list-certificates.use-case';
import { CertificatePresenter } from '../shared/certificate.presenter';

@ApiTags('certificates')
@Controller('v1/companies/:companyId/certificates')
@RequirePermission('fiscal.certificates.manage')
export class ListCertificatesRoute {
  constructor(private readonly listCertificates: ListCertificatesUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Listar certificados de um Emitente' })
  async handle(@Param('companyId') companyId: string) {
    const certificates = await this.listCertificates.execute({ companyId });
    return CertificatePresenter.toListHttp(certificates);
  }
}
