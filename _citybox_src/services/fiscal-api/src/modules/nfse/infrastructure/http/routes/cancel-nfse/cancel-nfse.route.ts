import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CancelNfseUseCase } from '../../../../application/use-cases/cancel-nfse/cancel-nfse.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { FiscalDocumentPresenter } from '../../../../../fiscal-documents/infrastructure/http/routes/shared/fiscal-document.presenter';
import { CancelNfseHttpDto } from './cancel-nfse.dto';

@ApiTags('nfse')
@Controller('v1/nfse')
@RequirePermission('fiscal.documents.manage')
export class CancelNfseRoute {
  constructor(private readonly cancelNfse: CancelNfseUseCase) {}

  @Post(':id/cancel')
  @ApiOperation({
    summary: 'Cancelar NFS-e (FR-004/FR-012)',
    description:
      'Dentro do prazo publicado pelo município o cancelamento é direto ' +
      '(`path: "DIRECT"`, status `CANCEL_AUTHORIZED`). Fora dele o pedido é ' +
      'encaminhado para análise fiscal (`path: "FISCAL_ANALYSIS"`, status ' +
      '`CANCEL_REQUESTED`) — a nota **continua válida** até o município julgar. ' +
      'Quem chama não escolhe o caminho.',
  })
  async handle(@Param('id') id: string, @Body() dto: CancelNfseHttpDto) {
    const { document, path } = await this.cancelNfse.execute({
      fiscalDocumentId: id,
      justification: dto.justification,
    });
    return { ...FiscalDocumentPresenter.toHttp(document), path };
  }
}
