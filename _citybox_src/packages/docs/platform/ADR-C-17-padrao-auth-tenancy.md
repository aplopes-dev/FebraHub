# ADR C-17 — Molde de autenticação e tenancy por sistema

**Status:** aceito
**Data:** 2026-08-13
**Depende de:** [ADR C-16](ADR-C-16-realm-por-sistema.md)

## Contexto

O [ADR C-16](ADR-C-16-realm-por-sistema.md) dá a cada sistema um realm próprio. Este ADR
define **como o código de cada app fala com o seu realm**.

**Decisão de arquitetura que torna este documento necessário:** não haverá pacote
compartilhado de autenticação. `@citybox/nest-common` é removido, e cada sistema mantém a
sua cópia do código de autenticação e provisionamento. A consolidação em pacote será
avaliada mais tarde, com o padrão já assentado.

A consequência é direta: **a consistência entre os sistemas deixa de ser garantida pelo
compilador e passa a ser garantida por este documento.** Ele não é resumo do padrão — é o
código canônico, para copiar.

A referência viva é `apps/erp/api/src/modules/tenancy/`, o módulo mais maduro do
monorepo. Os blocos abaixo são a versão dele já ajustada ao realm por sistema.

## Bloco 1 — Verificação de token

`src/shared/infra/keycloak/keycloak-jwt.ts`

```ts
import { jwtVerify, type JWTVerifyOptions, type JWTVerifyResult } from 'jose';

/**
 * Issuer ÚNICO, vindo do env.
 *
 * A versão anterior mantinha uma lista de fallback (`auth.citybox.com`,
 * `auth.citybox.com:8080`, `127.0.0.1:8080`) e tentava uma a uma até alguma
 * passar. Com um realm por sistema isso é perigoso: aceitar mais de um issuer
 * é aceitar token de mais de um realm.
 */
function requiredIssuer(): string {
  const issuer = process.env.KEYCLOAK_ISSUER?.trim();
  if (!issuer) throw new Error('KEYCLOAK_ISSUER não configurado');
  return issuer;
}

export async function verifyKeycloakJwt(
  token: string,
  jwks: Parameters<typeof jwtVerify>[1],
  opts: Omit<JWTVerifyOptions, 'issuer'> = {},
): Promise<JWTVerifyResult> {
  return jwtVerify(token, jwks, { ...opts, issuer: requiredIssuer() });
}
```

### Por que `azp` e não `aud`

O invariante 1 do C-16 exige validar o cliente emissor. **Use `azp`, não `aud`.**

Token real de `admin-m2m` no realm `citybox-erp`, capturado em 2026-08-13:

```
iss : http://127.0.0.1:8080/realms/citybox-erp
azp : admin-m2m
aud : account          ← não é o client
```

O Keycloak só coloca o client em `aud` quando há um *audience mapper* configurado; por
padrão `aud` é `account`. `azp` (authorized party) carrega sempre o `client_id` que pediu
o token. Validar `aud` sem mapper rejeitaria todo token válido.

```ts
/** Clients cujos tokens esta API aceita. Vem do env, sem default. */
export function allowedAuthorizedParties(): string[] {
  const raw = process.env.KEYCLOAK_ALLOWED_AZP?.trim();
  if (!raw) throw new Error('KEYCLOAK_ALLOWED_AZP não configurado');
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}
```

Valor típico numa vertical: `KEYCLOAK_ALLOWED_AZP=erp-web,admin-m2m` — o app web dos
lojistas e o chamador M2M do admin.

## Bloco 2 — Leitura de claims

`src/shared/infra/http/auth/authenticated-user.ts`

```ts
import type { JWTPayload } from 'jose';

export type AuthenticatedUser = {
  sub: string;
  roles: string[];
  username?: string;
  email?: string;
};

function readTokenString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * `clientId` é parâmetro, não literal.
 *
 * As seis cópias anteriores liam `resource_access['citybox-backoffice']`
 * hardcoded — o que só funcionava porque um client servia quatro apps.
 */
export function authenticatedUserFromJwtPayload(
  payload: JWTPayload,
  opts: { clientId: string },
): AuthenticatedUser {
  const realmRoles =
    (payload.realm_access as { roles?: string[] } | undefined)?.roles ?? [];
  const resourceAccess = payload.resource_access as
    | Record<string, { roles?: string[] }>
    | undefined;
  const clientRoles = resourceAccess?.[opts.clientId]?.roles ?? [];

  return {
    sub: payload.sub ?? 'unknown',
    roles: [...new Set([...realmRoles, ...clientRoles])],
    username:
      readTokenString(payload.preferred_username) ??
      readTokenString(payload.username),
    email: readTokenString(payload.email),
  };
}
```

## Bloco 3 — Guard

`src/shared/infra/http/guards/auth.guard.ts`

```ts
import {
  CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createRemoteJWKSet } from 'jose';
import { allowedAuthorizedParties, verifyKeycloakJwt } from '../../keycloak/keycloak-jwt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import {
  authenticatedUserFromJwtPayload, type AuthenticatedUser,
} from '../auth/authenticated-user';

@Injectable()
export class AuthGuard implements CanActivate {
  private jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(), ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<{
      headers: Record<string, string>;
      user?: AuthenticatedUser;
    }>();
    const header = req.headers.authorization ?? req.headers.Authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Bearer token obrigatório');
    }

    const issuer = process.env.KEYCLOAK_ISSUER?.trim();
    if (!issuer) throw new Error('KEYCLOAK_ISSUER não configurado');
    this.jwks ??= createRemoteJWKSet(
      new URL(`${issuer}/protocol/openid-connect/certs`),
    );

    try {
      const { payload } = await verifyKeycloakJwt(header.slice(7), this.jwks);

      // Invariante 1 do C-16: token de outro client do MESMO realm não passa.
      const azp = typeof payload.azp === 'string' ? payload.azp : '';
      if (!allowedAuthorizedParties().includes(azp)) {
        throw new UnauthorizedException(`Client não autorizado: ${azp || '(ausente)'}`);
      }

      req.user = authenticatedUserFromJwtPayload(payload, {
        clientId: process.env.KEYCLOAK_CLIENT_ID ?? '',
      });
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Token inválido ou expirado');
    }
    return true;
  }
}
```

**Dev bypass:** o ERP tem `dev-bypass.ts` com allow-list de ambiente. Quem já usa,
mantém — mas o bypass entra **antes** da verificação, nunca como fallback de erro.

## Bloco 4 — Porta de identidade

`src/modules/tenancy/domain/providers/identity-provider.interface.ts`

```ts
export type IdentityUser = {
  sub: string;
  email: string | null;
  username: string | null;
};

export type CreateIdentityInput = {
  email: string;
  firstName: string;
  lastName: string;
};

/**
 * Porta para o provedor de identidade (hoje, Keycloak).
 *
 * O domínio só conhece "criar uma identidade e dar a ela uma senha de primeiro
 * acesso" — nada de realms, roles ou tokens. Identidade fora, autorização dentro.
 */
export abstract class IdentityProvider {
  abstract findByEmail(email: string): Promise<IdentityUser | null>;

  /** Idempotente: e-mail já existente devolve o `sub` com `created: false`. */
  abstract createUser(
    input: CreateIdentityInput,
  ): Promise<{ sub: string; created: boolean }>;

  abstract setProvisionalPassword(sub: string, password: string): Promise<void>;

  abstract setEnabled(sub: string, enabled: boolean): Promise<void>;

  /** Compensação: desfaz uma identidade recém-criada quando o restante falha. */
  abstract deleteUser(sub: string): Promise<void>;
}
```

**Removido em relação ao ERP de hoje:** `ensureComercioBackofficeAccess(sub)`. Concedia
`store_staff` + `vertical.comercio.view`; com realm próprio, estar no realm é o gate.

## Bloco 5 — Serviço de provisionamento

`src/shared/infra/keycloak/keycloak-provisioning.service.ts` — cópia de
`packages/nest-common/src/keycloak/keycloak-provisioning.service.ts` com duas mudanças.

```ts
export class KeycloakProvisioningService {
  constructor(config: {
    issuer: string;        // KEYCLOAK_ISSUER — o realm do próprio sistema
    clientId: string;      // KEYCLOAK_PROVISIONING_CLIENT_ID
    clientSecret: string;  // KEYCLOAK_PROVISIONING_CLIENT_SECRET
  });

  findByEmail(email: string): Promise<KeycloakUser | null>;
  createUser(input: CreateUserInput): Promise<{ sub: string; created: boolean }>;
  setProvisionalPassword(sub: string, password: string): Promise<void>;
  setEnabled(sub: string, enabled: boolean): Promise<void>;
  deleteUser(sub: string): Promise<void>;
}
```

1. **`provisionMember()` perde `verticalRole` e `realmRole`.** Hoje beautiful passa
   `{ verticalRole: 'vertical.beautiful.view', realmRole: 'store_staff' }` e imóveis
   passa `vertical.imoveis.view`. Essas roles não existem mais.
2. **Credencial:** `<sistema>-provisioning`, não `citybox-core-admin`.

> **Preservar o tratamento de 409 por e-mail.** O original documenta na linha 188 por que
> a busca prévia olha username **e** e-mail: o Keycloak devolve 409 nos dois casos, e
> olhar só o username deixava passar um e-mail já cadastrado sob outro username. Esse é o
> defeito D1. Copiar o comportamento inteiro, com o comentário.

## Bloco 6 — Web

`src/lib/oauth-pkce.ts`, `auth-server.ts`, `auth.ts`

```ts
export async function beginOAuthAuthorization(
  redirectUri: string,
  force = false,
): Promise<string> {
  const issuer = process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER;
  if (!issuer) throw new Error('NEXT_PUBLIC_KEYCLOAK_ISSUER não configurado');

  // Sem default. O ERP tinha `?? 'citybox-backoffice'`: um app mal configurado
  // silenciosamente pedia token para o client errado, em vez de falhar.
  const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT;
  if (!clientId) throw new Error('NEXT_PUBLIC_KEYCLOAK_CLIENT não configurado');

  const state = randomUrlSafe(32);
  const codeVerifier = randomUrlSafe(48);
  const codeChallenge = await createCodeChallenge(codeVerifier);
  saveOAuthPending({ state, codeVerifier, redirectUri });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });
  if (force) params.set('prompt', 'login');

  return `${issuer}/protocol/openid-connect/auth?${params}`;
}
```

**Preservar do ERP:** o `pending` por aba (`sessionStorage` + tab id) — duas abas
logando ao mesmo tempo sobrescreviam o `code_verifier` uma da outra; e
`isSafeLogoutUrl`, que só aceita redirect para o logout do próprio Keycloak ou para o
`/login` local.

**Sobre o D2:** com realms separados, abrir o ERP logado no admin já pede login — são
sessões distintas. `prompt=login` continua útil para forçar reautenticação dentro do
mesmo sistema (troca de conta).

## Bloco 7 — Módulo de tenancy

Árvore alvo, idêntica em ERP, clínica, beautiful e imóveis:

```
modules/tenancy/
  domain/providers/identity-provider.interface.ts
  infrastructure/keycloak/keycloak-identity.adapter.ts
  application/use-cases/provision-platform-store/      ← síncrono (M2M), devolve senha
  application/use-cases/sync-organization-from-store/
  infrastructure/messaging/consumers/store-platform.consumer.ts   ← assíncrono, sem senha
  infrastructure/messaging/event-dedupe.service.ts     ← at-least-once
  tests/fake-identity.provider.ts
```

**Dois caminhos de provisionamento, de propósito.** O síncrono atende o admin, que espera
`username` + senha provisória no modal. O consumer de evento **não** define senha — o
admin gera depois via `POST …/platform/stores/:id/owner/reset-password`.

**Rota M2M:**

```ts
@Post(':platformStoreId/provision')
@SkipTenant()
@RequirePermission('platform.admin')
```

`platform.admin` vem da role **local do realm** atribuída ao service account `admin-m2m`
(C-16 §Papéis). O `PermissionGuard` do ERP funciona sem alteração.

## Bloco 8 — Fora de escopo

Não fazem parte desta leva. Agente que encontrar motivo para expandir **para e reporta**:

- Converter o modelo de permissões do beautiful (`StoreMember.permissions Json` +
  `store-role.catalog.ts`) para `PermissionProfile`. O padrão exigido é o de **identidade
  e provisionamento**; o catálogo de permissões pode continuar lean.
- Introduzir `Organization` no schema `imoveis` sem a decisão da etapa E1 do plano.
  Imóveis usa `storeId` como raiz e `TeamMember` + `StoreSettings`; mudar isso é migration
  Prisma e exige `database-reviewer`.
- Criar pacote, helper compartilhado ou symlink para "evitar repetição". A duplicação é
  intencional.

## Contrato de env

```bash
KEYCLOAK_BASE_URL=http://127.0.0.1:8080
KEYCLOAK_REALM=citybox-<sistema>
KEYCLOAK_ISSUER=${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}
KEYCLOAK_CLIENT_ID=<sistema>-web
KEYCLOAK_CLIENT_SECRET=<secret>
KEYCLOAK_ALLOWED_AZP=<sistema>-web,admin-m2m
KEYCLOAK_PROVISIONING_CLIENT_ID=<sistema>-provisioning
KEYCLOAK_PROVISIONING_CLIENT_SECRET=<secret>
```

Web (Next.js) adiciona `NEXT_PUBLIC_KEYCLOAK_ISSUER` e `NEXT_PUBLIC_KEYCLOAK_CLIENT`.

No `admin-api`, uma credencial M2M por vertical:

```bash
KEYCLOAK_ERP_M2M_ISSUER=http://127.0.0.1:8080/realms/citybox-erp
KEYCLOAK_ERP_M2M_CLIENT_ID=admin-m2m
KEYCLOAK_ERP_M2M_CLIENT_SECRET=<secret>
# … idem CLINICA, BEAUTIFUL, IMOVEIS
```

Secrets de dev em Keycloak local: `<clientId>-dev-secret`
(ex.: `erp-web-dev-secret`, `admin-m2m-dev-secret`).

## Verificação

A fase F4 do plano roda um **diff cruzado** dos seis apps sobre os arquivos deste ADR
(`keycloak-jwt.ts`, `authenticated-user.ts`, `auth.guard.ts`,
`keycloak-provisioning.service.ts`, `oauth-pkce.ts`). Divergência é justificada no
`AGENTS.md` do app ou corrigida — divergência silenciosa não passa.

## Referências

- [ADR C-16](ADR-C-16-realm-por-sistema.md) — a decisão de realm por sistema
- Plano: `.claude/plans/_platform/2026-08-13-keycloak-realm-por-sistema.md`
- Referência viva: `apps/erp/api/src/modules/tenancy/`
