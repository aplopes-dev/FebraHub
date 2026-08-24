import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CompanyAccessPolicy } from '../../domain/tenant/company-access.policy';
import type { AuthenticatedUser } from '../http/auth/authenticated-user';

/// Mesmo bypass do `StoreMembershipGuard` do `admin-api` — mantém o
/// comportamento previsível entre serviços, e cobre o `AUTH_DEV_BYPASS`, que
/// injeta este role em desenvolvimento.
///
/// ⚠️ Role **pontuada** (`platform.admin`), não a antiga `platform_admin` do
/// realm compartilhado removida pelo ADR C-16. É o nome que `ROLE_PERMISSIONS`,
/// o `permission.guard.ts` e o `devBypassAuthenticatedUser` usam — a constante
/// antiga (underscore) fazia esta policy negar TODO `platform.admin` (bypass ou
/// JWT real de admin), caindo no lookup por `sub` e devolvendo 404.
const PLATFORM_ADMIN_ROLE = 'platform.admin';

/// Resolve o acesso ao Emitente pela **participação do usuário na loja** —
/// por **dois** modelos de tenancy possíveis (spec erp/022, BUG-01 do
/// re-teste 2026-08-14): o lojista pode ter sido provisionado pelo admin
/// (`platform.members`/`store_members`) OU criado direto no ERP
/// (`erp.users`/`erp.memberships`) — os dois vivem no MESMO banco Postgres
/// (`citybox`), em schemas diferentes, então a query crua de sempre só ganhou
/// um segundo braço em `UNION`:
///
/// ```
/// sub (JWT verificado)
///   → platform.members.keycloak_sub  → platform.store_members.store_id  ─┐
///   → erp.users.keycloak_sub → erp.memberships.organization_id           ├→ fiscal.companies.store_id
///     → erp.organizations.platform_store_id ─────────────────────────────┘
/// ```
///
/// Achado do re-teste: todo lojista criado em Configurações › Usuários e
/// Permissões do ERP (o caminho normal de onboarding) NUNCA ganha linha em
/// `platform.store_members` — só o admin-api escreve lá. A policy negava
/// 100% desses lojistas nas rotas que dependem dela (Séries, CSC).
///
/// **Por que consulta crua e não modelo Prisma.** `members`/`store_members`
/// (schema `platform`) e `organizations`/`memberships`/`users` (schema `erp`)
/// pertencem a outros serviços (admin-api e erp-api). Declará-los no
/// `schema.prisma` da `fiscal-api` faria três serviços donos das mesmas
/// tabelas — exatamente o que o Princípio V proíbe. A consulta é **somente
/// leitura**, atravessa a fronteira de schema de forma explícita e visível, e
/// não reivindica posse.
///
/// **Por que não uma chamada HTTP ao admin-api/erp-api.** Colocaria uma
/// dependência de rede em *toda* impressão de documento: mais latência contra
/// o orçamento de 5 s (SC-001) e um modo de falha novo — qualquer um dos dois
/// fora do ar impediria imprimir uma nota que a `fiscal-api` tem inteira em
/// mãos.
///
/// **`UNION`, não `LEFT JOIN`/`OR`.** Os dois braços são buscas independentes
/// por `sub`; um `LEFT JOIN` com `OR` entre colunas de tabelas diferentes que
/// podem ser `NULL` é fácil de errar pra um estado permissivo por acidente.
/// `UNION` mantém cada braço simples e correto isoladamente — `company` sem
/// `erp.organizations.platform_store_id` correspondente simplesmente não
/// produz linha nesse braço (comparação com `NULL` nunca é verdadeira), sem
/// precisar de um `CASE`/`COALESCE` para o caso "sem organização ERP" (nega
/// por ausência de linha, não por lógica condicional extra).
///
/// **`o.status = 'ACTIVE' AND o.deleted_at IS NULL`** (achado do
/// security-reviewer no diff desta feature): `ms.active = TRUE` sozinho não
/// basta — o próprio erp-api (`tenant-context.guard.ts`) nega acesso a
/// organização `SUSPENDED`/`INACTIVE`/soft-deletada mesmo com vínculo ativo
/// (ex.: suspensão por fatura em atraso, ver `store-platform.consumer.ts`).
/// Sem este filtro aqui, um lojista suspenso continuaria emitindo NFC-e e
/// girando o CSC pela fiscal-api mesmo bloqueado no resto do ERP — mesmo
/// espírito de fail-closed, extensão necessária pra fechar de fato o gap.
///
/// **Custo do acoplamento, declarado:** se o admin-api ou o erp-api
/// renomearem essas tabelas/colunas, isto quebra em runtime sem erro de
/// compilação. O teste de integração é o que dá o aviso.
@Injectable()
export class StoreMembershipCompanyAccessPolicy extends CompanyAccessPolicy {
  private readonly logger = new Logger(StoreMembershipCompanyAccessPolicy.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async canActFor(
    companyId: string,
    user: AuthenticatedUser,
  ): Promise<boolean> {
    if (user.roles.includes(PLATFORM_ADMIN_ROLE)) return true;

    // Sem `sub` utilizável não há como resolver a loja. Negar é o padrão:
    // liberar "quando não dá para checar" reintroduziria exatamente o buraco
    // que esta classe fecha.
    if (!user.sub || user.sub === 'unknown') return false;

    try {
      const rows = await this.prisma.$queryRaw<{ allowed: boolean }[]>`
        SELECT TRUE AS allowed
        FROM fiscal.companies c
        JOIN platform.store_members sm ON sm.store_id::uuid = c.store_id
        JOIN platform.members m ON m.id = sm.member_id
        WHERE c.id = ${companyId}::uuid
          AND m.keycloak_sub = ${user.sub}
        UNION
        SELECT TRUE AS allowed
        FROM fiscal.companies c
        JOIN erp.organizations o ON o.platform_store_id::uuid = c.store_id
        JOIN erp.memberships ms ON ms.organization_id = o.id
        JOIN erp.users u ON u.id = ms.user_id
        WHERE c.id = ${companyId}::uuid
          AND u.keycloak_sub = ${user.sub}
          AND ms.active = TRUE
          AND o.status = 'ACTIVE'
          AND o.deleted_at IS NULL
        LIMIT 1
      `;
      return rows.length > 0;
    } catch (error: unknown) {
      // Falha de consulta **nega**. Um `catch` que liberasse transformaria
      // indisponibilidade de banco em bypass de autorização.
      this.logger.error(
        `Falha ao resolver acesso do sub ${user.sub} ao Emitente ${companyId}; negando por precaução. Causa: ${
          error instanceof Error ? error.message : 'desconhecida'
        }`,
      );
      return false;
    }
  }
}
