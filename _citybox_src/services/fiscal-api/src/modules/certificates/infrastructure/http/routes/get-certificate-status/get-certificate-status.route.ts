import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { GetCertificateStatusUseCase } from '../../../../application/use-cases/get-certificate-status/get-certificate-status.use-case';

// `fiscal.certificates.view` não existe como escopo separado hoje
// (permissions.ts só define `.manage` para certificados, diferente de
// fiscal-documents que tem `.manage`/`.view`) — reaproveita `.manage`
// em vez de introduzir um novo escopo de permissão sem essa necessidade
// ter sido pedida por nenhuma tarefa.
@ApiTags('certificates')
@Controller('v1/certificates')
@RequirePermission('fiscal.certificates.manage')
export class GetCertificateStatusRoute {
  constructor(
    private readonly getCertificateStatus: GetCertificateStatusUseCase,
  ) {}

  @Get(':id/status')
  @ApiOperation({
    summary:
      'Consultar validade rápida de um certificado (US3 cenário 3, FR-008)',
  })
  async handle(@Param('id') id: string) {
    const result = await this.getCertificateStatus.execute({
      certificateId: id,
    });
    return { data: result };
  }
}
