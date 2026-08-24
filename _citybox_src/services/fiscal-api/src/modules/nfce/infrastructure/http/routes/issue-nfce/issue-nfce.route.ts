import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IssueNfceUseCase } from '../../../../application/use-cases/issue-nfce/issue-nfce.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { CompanyId } from '../../../../../../shared/infra/http/decorators/company-id.decorator';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../../../../shared/infra/http/auth/authenticated-user';
import { FiscalDocumentPresenter } from '../../../../../fiscal-documents/infrastructure/http/routes/shared/fiscal-document.presenter';
import { IssueNfceBodyDto } from './issue-nfce.dto';

/// US1 — `POST /api/v1/nfce`.
///
/// ⚠️ **O Emitente vem do header, não do corpo** — diferente de
/// `IssueNfeRoute`, que aceita `companyId` no body. A mudança é deliberada: no
/// corpo, o Emitente é apenas mais um campo que o chamador escolhe, e nada o
/// confronta com quem está autenticado. Aqui o header é afirmação e a
/// `CompanyAccessPolicy` é quem decide, a partir do `sub` do JWT.
@ApiTags('nfce')
@Controller('v1/nfce')
@RequirePermission('fiscal.documents.manage')
export class IssueNfceRoute {
  constructor(private readonly issueNfce: IssueNfceUseCase) {}

  @Post()
  @HttpCode(201)
  @ApiHeader({
    name: 'X-Company-Id',
    required: true,
    description:
      'Emitente em nome de quem se emite. Validado no servidor contra a participação do usuário autenticado na loja — informar o UUID de outra empresa responde 404.',
  })
  @ApiOperation({
    summary: 'Emitir cupom fiscal eletrônico (NFC-e, modelo 65)',
    description:
      'Chamada síncrona: o desfecho junto à SEFAZ vem na resposta. Venda a consumidor não identificado é o caso comum e é autorizada normalmente. Numeração isolada da NF-e.',
  })
  async handle(
    @Body() body: IssueNfceBodyDto,
    @CompanyId() companyId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const document = await this.issueNfce.execute({
      ...body,
      companyId,
      user,
    });
    return FiscalDocumentPresenter.toHttp(document);
  }
}
