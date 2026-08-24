import { Injectable, Logger } from '@nestjs/common';
import { CompanyAccessPolicy } from '../../domain/tenant/company-access.policy';
import type { AuthenticatedUser } from '../http/auth/authenticated-user';
import { allowedAuthorizedParties } from '../keycloak/keycloak-jwt';

/**
 * Autoriza o acesso ao Emitente pela identidade do **sistema chamador**.
 *
 * ## Por que substituiu a resolução por `sub`
 *
 * A implementação anterior (`StoreMembershipCompanyAccessPolicy`) resolvia
 * `sub → platform.members → platform.store_members → fiscal.companies`. Isso
 * funcionava quando havia um realm só e o mesmo `sub` servia admin e ERP.
 *
 * Com um realm por sistema (ADR C-16) a cadeia quebrou por duas razões, e
 * nenhuma delas é contornável remendando a query:
 *
 * 1. A identidade do lojista deixou de morar em `platform.members` — ela é do
 *    ERP agora (`erp.users.keycloak_sub`), e o `platform` é do admin.
 * 2. O token que chega aqui é **M2M**: o `sub` é de service account, não de
 *    pessoa. Não existe usuário para resolver.
 *
 * ## Onde a autorização passou a ser feita
 *
 * Na `erp-api`, antes de chamar: ela resolve o `Membership` do usuário e só
 * então usa a credencial `fiscal-m2m`. Quem sabe se "o usuário X pode operar o
 * Emitente Y" é o sistema dono do tenant — a `fiscal-api` nunca teve esse dado
 * sem atravessar a fronteira de schema de outro serviço.
 *
 * É o modelo que o v1 já declarava esperar (FR-015: "confiando que os sistemas
 * internos do CityBox já controlam o acesso por Loja/Emitente antes de chamar
 * esta API") — a diferença é que agora o caminho de rede corresponde a ele: o
 * usuário final não fala mais direto com este serviço.
 *
 * ## O que esta classe ainda protege
 *
 * A allowlist de `azp`. Um token válido de um client não declarado — inclusive
 * de um app de usuário final do próprio realm do ERP — é recusado. Sem isso,
 * bastaria um token de `erp-web` para chamar direto, pulando a validação de
 * tenant da `erp-api`.
 *
 * ⚠️ **Consequência a manter em vista:** a força desta autorização é agora a da
 * `erp-api`. Sistema novo que ganhar credencial M2M aqui precisa validar o
 * vínculo antes de chamar — não há segunda barreira neste serviço.
 */
@Injectable()
export class TrustedSystemCompanyAccessPolicy extends CompanyAccessPolicy {
  private readonly logger = new Logger(TrustedSystemCompanyAccessPolicy.name);

  canActFor(companyId: string, user: AuthenticatedUser): Promise<boolean> {
    // Dev bypass (`AUTH_DEV_BYPASS`): o `AuthGuard` injeta um usuário
    // `platform.admin` sem `azp` para o token `dev-admin`. A allowlist de `azp`
    // negaria esse usuário — então, e SÓ fora de produção com o bypass ligado,
    // o role `platform.admin` libera. Mesma condição do guard: em produção
    // `AUTH_DEV_BYPASS` nunca é `'true'`, então este caminho não existe lá.
    if (
      process.env.NODE_ENV !== 'production' &&
      process.env.AUTH_DEV_BYPASS === 'true' &&
      user.roles.includes('platform.admin')
    ) {
      return Promise.resolve(true);
    }

    const caller = user.clientId?.trim();

    // Negar é o padrão: token sem `azp` não identifica sistema nenhum, e
    // liberar "quando não dá para saber quem chamou" anularia a allowlist.
    if (!caller) {
      this.logger.warn(
        `Token sem azp tentou agir pelo Emitente ${companyId}; negando.`,
      );
      return Promise.resolve(false);
    }

    const trusted = allowedAuthorizedParties().includes(caller);
    if (!trusted) {
      this.logger.warn(
        `Client ${caller} não está na allowlist e tentou agir pelo Emitente ${companyId}; negando.`,
      );
    }
    return Promise.resolve(trusted);
  }
}
