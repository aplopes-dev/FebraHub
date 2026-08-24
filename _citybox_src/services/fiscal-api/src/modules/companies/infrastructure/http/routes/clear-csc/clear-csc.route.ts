import { Controller, Delete, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ClearCscUseCase } from '../../../../application/use-cases/clear-csc/clear-csc.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../../../../shared/infra/http/auth/authenticated-user';
import { CompanyPresenter } from '../shared/company.presenter';

/// spec erp/024, Parte B — volta o Emitente a "CSC não configurado".
///
/// Mesmo `@Controller('v1/companies')` de `SetCscRoute`, mesmo path
/// `:id/csc` — só o verbo muda. O bloqueio "não remover com o PDV em Modelo
/// 65" **não mora aqui**: mora no proxy `erp-web`
/// (`app/api/proxy/fiscal/[...path]/route.ts`), que é quem consegue
/// consultar tanto este Emitente quanto `pos_fiscal_settings` da erp-api.
/// Esta rota, isolada, sempre remove — é intencional (ver `plan.md`/FR-009).
@ApiTags('companies')
@Controller('v1/companies')
@RequirePermission('fiscal.companies.manage')
export class ClearCscRoute {
  constructor(private readonly clearCsc: ClearCscUseCase) {}

  @Delete(':id/csc')
  @ApiOperation({
    summary: 'Remover o CSC do Emitente (volta a "não configurado")',
    description:
      'Zera o par CSC ID + token. Idempotente — chamar sobre um Emitente sem CSC também responde com sucesso. Nunca devolve nem loga o valor removido.',
  })
  async handle(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const company = await this.clearCsc.execute({ companyId: id, user });
    return CompanyPresenter.toHttp(company);
  }
}
