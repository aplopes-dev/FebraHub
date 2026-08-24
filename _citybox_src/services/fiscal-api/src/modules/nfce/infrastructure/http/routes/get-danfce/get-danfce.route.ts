import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  GetAuxiliaryDocumentUseCase,
  type AuxiliaryDocumentFormat,
} from '../../../../../auxiliary-documents/application/use-cases/get-auxiliary-document/get-auxiliary-document.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { CompanyId } from '../../../../../../shared/infra/http/decorators/company-id.decorator';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../../../../shared/infra/http/auth/authenticated-user';

/// `formato=a4` na query → leiaute A4. Qualquer outro valor, inclusive
/// ausente, cai na **bobina**.
///
/// Silencioso de propósito: um `formato=A5` recusado com 400 travaria o caixa
/// por um erro de digitação em parâmetro cosmético, com o cliente esperando. O
/// padrão é o formato oficial do cupom, então cair nele nunca produz documento
/// inválido — só não atende a preferência.
function resolveFormat(value: string | undefined): AuxiliaryDocumentFormat {
  return value?.trim().toUpperCase() === 'A4' ? 'A4' : 'DEFAULT';
}

/// US2 — `GET /api/v1/nfce/{id}/danfce`.
@ApiTags('nfce')
@Controller('v1/nfce')
@RequirePermission('fiscal.documents.view')
export class GetDanfceRoute {
  constructor(
    private readonly getAuxiliaryDocument: GetAuxiliaryDocumentUseCase,
  ) {}

  @Get(':id/danfce')
  @ApiHeader({
    name: 'X-Company-Id',
    required: true,
    description:
      'Emitente em nome de quem se solicita. Validado no servidor contra a participação do usuário autenticado na loja — informar o UUID de outra empresa responde 404.',
  })
  @ApiQuery({
    name: 'formato',
    required: false,
    enum: ['bobina', 'a4'],
    description:
      'Padrão: bobina (leiaute oficial da NFC-e, impressora térmica). `a4` devolve a via para guardar e reenviar, com os MESMOS dados fiscais.',
  })
  @ApiOperation({
    summary: 'Baixar o documento auxiliar do cupom fiscal (DANFE NFC-e)',
    description:
      'Gera o documento a partir do XML autorizado. Em homologação sai com marca d’água. Cupom cancelado é entregue marcado, porque o histórico precisa ser reconstituível.',
  })
  @ApiOkResponse({ description: 'PDF do cupom.' })
  async handle(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() response: Response,
    @Query('formato') formato?: string,
  ): Promise<void> {
    const document = await this.getAuxiliaryDocument.execute({
      fiscalDocumentId: id,
      companyId,
      user,
      format: resolveFormat(formato),
    });

    // ⚠️ `Content-Type` setado AQUI, depois do `execute()`, e não por
    // `@Header()` no método. O Nest aplica os headers do decorator **antes** de
    // invocar o handler, então toda resposta de ERRO sairia rotulada como PDF
    // e o cliente nunca chegaria ao `error.code`. Mesma razão documentada em
    // `get-danfe.route.ts`.
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      `inline; filename="${document.fileName}"`,
    );
    response.setHeader('X-Document-Origin', document.origin);
    response.setHeader(
      'X-Fiscal-Validity',
      document.isFiscallyValid ? 'VALID' : 'NONE',
    );

    response.end(document.content);
  }
}
