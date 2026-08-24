import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SubstituteNfseUseCase } from '../../../../application/use-cases/substitute-nfse/substitute-nfse.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { toFiscalDocumentResponse } from '../../../../../fiscal-documents/infrastructure/http/routes/shared/fiscal-document-response.mapper';
import { SubstituteNfseHttpDto } from './substitute-nfse.dto';

@ApiTags('nfse')
@Controller('v1/nfse')
@RequirePermission('fiscal.documents.manage')
export class SubstituteNfseRoute {
  constructor(private readonly substituteNfse: SubstituteNfseUseCase) {}

  @Post(':id/substitute')
  @ApiOperation({
    summary: 'Substituir uma NFS-e emitida (FR-013)',
    description:
      'Emite uma nota corrigida e registra o evento `e105102` na original, ' +
      'preservando o vínculo entre as duas. A resposta traz **ambas**: a nova ' +
      'nota (`substitute`) e a original já cancelada por substituição ' +
      '(`original`).\n\n' +
      'Recusas possíveis (422, com o motivo em `error.code`): prazo de ' +
      'substituição encerrado ou não publicado pelo município, tomador não ' +
      'identificado quando o município exige, análise fiscal em julgamento, ou ' +
      'bloqueio de ofício.\n\n' +
      'Se a nota nova **não** for autorizada, o evento não é registrado e a ' +
      'original permanece válida — o serviço prestado nunca fica sem nota.',
  })
  async handle(@Param('id') id: string, @Body() dto: SubstituteNfseHttpDto) {
    const { original, substitute } = await this.substituteNfse.execute({
      fiscalDocumentId: id,
      replacement: dto.replacement,
      reasonCode: dto.reasonCode,
      reasonText: dto.reasonText,
      hasOfficialBlock: dto.hasOfficialBlock,
    });

    // Envelope UNICO `{ data: ... }`, como nas demais rotas.
    // `FiscalDocumentPresenter.toHttp` ja embrulha cada documento, entao usa-lo
    // aqui produzia `{original:{data:{...}}, substitute:{data:{...}}}` — o
    // cliente teria de ler `body.original.data.status`, fora do padrao da API.
    return {
      data: {
        original: toFiscalDocumentResponse(original),
        substitute: toFiscalDocumentResponse(substitute),
      },
    };
  }
}
