import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CancelNfeUseCase } from '../../../../../nfe/application/use-cases/cancel-nfe/cancel-nfe.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { FiscalDocumentPresenter } from '../../../../../fiscal-documents/infrastructure/http/routes/shared/fiscal-document.presenter';
import { CancelNfeHttpDto } from '../../../../../nfe/infrastructure/http/routes/cancel-nfe/cancel-nfe.dto';

/// US4 — `POST /api/v1/nfce/{id}/cancel`.
///
/// Delega a `CancelNfeUseCase`, que já resolve o prazo por
/// `document.documentType` — **30 minutos** para cupom, contra 24 horas da
/// NF-e — e o transporte por `document.provider`. Ver
/// `modules/nfce/.../cancel-nfce.use-case.spec.ts` para o porquê de não haver
/// caso de uso paralelo.
///
/// Rota própria, ainda assim: quem procura o que dá para fazer com um cupom
/// encontra tudo sob `/v1/nfce` e a mesma tag do Swagger. O DTO é reusado
/// porque a exigência de justificativa (15–255 caracteres) vem do mesmo schema
/// oficial — duplicá-lo deixaria as duas validações livres para divergir.
@ApiTags('nfce')
@Controller('v1/nfce')
@RequirePermission('fiscal.documents.manage')
export class CancelNfceRoute {
  constructor(private readonly cancelNfce: CancelNfeUseCase) {}

  @Post(':id/cancel')
  @ApiOperation({
    summary: 'Cancelar cupom fiscal dentro do prazo (FR-008)',
    description:
      'Prazo de 30 minutos a partir da autorização — bem mais curto que o da NF-e. Fora do prazo a resposta é 409, dizendo o prazo em hora local e o próximo passo. O cupom NÃO admite substituição.',
  })
  async handle(@Param('id') id: string, @Body() dto: CancelNfeHttpDto) {
    const document = await this.cancelNfce.execute({
      fiscalDocumentId: id,
      justification: dto.justification,
    });
    return FiscalDocumentPresenter.toHttp(document);
  }
}
