import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConsultNfeUseCase } from '../../../../../nfe/application/use-cases/consult-nfe/consult-nfe.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { FiscalDocumentPresenter } from '../../../../../fiscal-documents/infrastructure/http/routes/shared/fiscal-document.presenter';

/// Reaproveita `ConsultNfeUseCase` — a lógica (reconsultar o provider só
/// quando `status = SYNC_REQUIRED`, resolvido via `document.provider`) é
/// genérica, sem nada específico de NF-e; o nome da classe é um resquício
/// histórico de ter sido implementada primeiro para US1.
@ApiTags('nfse')
@Controller('v1/nfse')
@RequirePermission('fiscal.documents.view')
export class GetNfseRoute {
  constructor(private readonly consultNfse: ConsultNfeUseCase) {}

  @Get(':id')
  @ApiOperation({ summary: 'Consultar status de uma NFS-e' })
  async handle(@Param('id') id: string) {
    const document = await this.consultNfse.execute({ fiscalDocumentId: id });
    return FiscalDocumentPresenter.toHttp(document);
  }
}
