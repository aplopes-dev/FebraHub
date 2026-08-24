import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { GetAuxiliaryDocumentUseCase } from '../../../../../auxiliary-documents/application/use-cases/get-auxiliary-document/get-auxiliary-document.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { CompanyId } from '../../../../../../shared/infra/http/decorators/company-id.decorator';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../../../../shared/infra/http/auth/authenticated-user';

@ApiTags('nfse')
@Controller('v1/nfse')
@RequirePermission('fiscal.documents.view')
export class GetDanfseRoute {
  constructor(
    private readonly getAuxiliaryDocument: GetAuxiliaryDocumentUseCase,
  ) {}

  @Get(':id/danfse')
  @ApiHeader({
    name: 'X-Company-Id',
    required: true,
    description:
      'Emitente em nome de quem se solicita. O acesso é validado no servidor contra a participação do usuário autenticado na loja — informar o UUID de outra empresa responde 404, não entrega o documento.',
  })
  @ApiOperation({
    summary: 'Baixar o DANFSE de uma NFS-e autorizada',
    description:
      'Documento auxiliar da NFS-e, no leiaute do Padrão Nacional — distinto do DANFE. Quando a API oficial do Sefin estiver disponível, ela é a fonte preferida; sua indisponibilidade não impede a entrega, e o header X-Document-Origin informa qual caminho produziu o arquivo. Em homologação o PDF sai com marca d’água, inclusive quando vem do órgão.',
  })
  @ApiOkResponse({ description: 'PDF do DANFSE.' })
  async handle(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() response: Response,
  ): Promise<void> {
    const document = await this.getAuxiliaryDocument.execute({
      fiscalDocumentId: id,
      companyId,
      user,
    });

    // ⚠️ `Content-Type` é setado AQUI, e não por `@Header()` no método.
    //
    // O Nest aplica os headers do decorator **antes** de invocar o handler
    // (`router-execution-context.js`: `setHeaders` precede `handler(...)`). Com
    // `@Header('Content-Type', 'application/pdf')`, toda resposta de ERRO —
    // 404 de FR-007, 422 de FR-003, 503 de FR-010 — sairia rotulada como PDF,
    // porque o `res.json()` do Express não sobrescreve um Content-Type já
    // definido. O ERP receberia JSON marcado como binário e nunca chegaria ao
    // `error.code` que estas rotas fazem questão de tornar explícito.
    //
    // Setar depois do `execute()` garante que só a resposta de sucesso é PDF.
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      `inline; filename="${document.fileName}"`,
    );
    // FR-002b — é aqui que a origem vira observável. Sem isso, uma divergência
    // visual entre duas vias da mesma nota viraria mistério em fiscalização.
    response.setHeader('X-Document-Origin', document.origin);
    response.setHeader(
      'X-Fiscal-Validity',
      document.isFiscallyValid ? 'VALID' : 'NONE',
    );

    response.end(document.content);
  }
}
