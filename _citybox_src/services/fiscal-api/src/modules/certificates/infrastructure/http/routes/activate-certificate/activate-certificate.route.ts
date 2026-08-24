import { Controller, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { ActivateCertificateUseCase } from '../../../../application/use-cases/activate-certificate/activate-certificate.use-case';
import { CertificatePresenter } from '../shared/certificate.presenter';

@ApiTags('certificates')
@Controller('v1/certificates')
@RequirePermission('fiscal.certificates.manage')
export class ActivateCertificateRoute {
  constructor(
    private readonly activateCertificate: ActivateCertificateUseCase,
  ) {}

  @Patch(':id/activate')
  @ApiOperation({
    summary: 'Marcar um certificado VALID como o ativo do Emitente',
  })
  async handle(@Param('id') id: string) {
    const certificate = await this.activateCertificate.execute({
      certificateId: id,
    });
    return CertificatePresenter.toHttp(certificate);
  }
}
