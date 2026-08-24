import { Injectable } from '@nestjs/common';
import {
  VerticalMemberProvisioning,
  type CreateVerticalMemberInput,
  type CreateVerticalMemberResult,
  type ProvisionVerticalStoreInput,
  type ProvisionVerticalStoreResult,
  type ResetVerticalOwnerPasswordResult,
  type VerticalMember,
  type VerticalUnit,
} from '../../domain/providers/vertical-member-provisioning.provider';
import {
  VerticalNotSupportedError,
  VerticalOwnerNotFoundError,
  VerticalProvisioningError,
} from '../../domain/errors/vertical-provisioning.error';

const REQUEST_TIMEOUT_MS = 15_000;
/** Template v4 + Keycloak no provision HTTP — precisa de margem maior. */
const PROVISION_TIMEOUT_MS = 30_000;

/**
 * Verticais que expõem API de membros (dona da equipe).
 * Base URL sem path — o adapter acrescenta `/api/v1/...`.
 */
const VERTICAL_BASE_URL: Record<string, () => string | undefined> = {
  Clínica: () => process.env.CLINICA_API_URL,
  Comércio: () => process.env.ERP_API_URL,
  Imóveis: () => process.env.IMOVEIS_API_URL,
  Beautiful: () => process.env.BEAUTIFUL_API_URL,
};

type TokenCache = { value: string; expiresAtMs: number };

/**
 * Prefixo das envs da credencial M2M de cada vertical (ADR C-17 §Contrato de env).
 *
 * O client `admin-m2m` vive **dentro do realm da vertical**, não no realm do admin
 * (ADR C-16 §2.1). Por isso são três valores por vertical — `_ISSUER`, `_CLIENT_ID`
 * e `_CLIENT_SECRET` — e não um token só para todas.
 */
const VERTICAL_M2M_ENV_PREFIX: Record<string, string> = {
  Clínica: 'KEYCLOAK_CLINICA_M2M',
  Comércio: 'KEYCLOAK_ERP_M2M',
  Imóveis: 'KEYCLOAK_IMOVEIS_M2M',
  Beautiful: 'KEYCLOAK_BEAUTIFUL_M2M',
};

type M2mCredentials = {
  issuer: string;
  clientId: string;
  clientSecret: string;
};

/**
 * Adapter HTTP machine-to-machine `admin-api → vertical-api`.
 *
 * Autentica com `client_credentials` **no realm de cada vertical**, usando o client
 * `admin-m2m` daquele realm. Antes do ADR C-16 havia um único token, tirado do realm
 * compartilhado e reusado em todas as verticais — o que deixou de funcionar, porque
 * cada vertical agora valida `issuer` e `azp` do seu próprio realm.
 *
 * O `admin-m2m` **não** tem `manage-users`: só a realm role `platform.admin`, que é o
 * que a vertical exige em `@RequirePermission('platform.admin')`. Escrever usuário no
 * Keycloak da vertical é responsabilidade do `<sistema>-provisioning` dela, não do admin.
 */
@Injectable()
export class HttpVerticalMemberProvisioning extends VerticalMemberProvisioning {
  /** Cache por vertical: os tokens são de realms diferentes e não se substituem. */
  private readonly tokens = new Map<string, TokenCache>();

  isSupported(vertical: string): boolean {
    return Boolean(VERTICAL_BASE_URL[vertical]?.());
  }

  private m2mCredentials(vertical: string): M2mCredentials {
    const prefix = VERTICAL_M2M_ENV_PREFIX[vertical];
    if (!prefix) {
      throw new VerticalNotSupportedError(
        HttpVerticalMemberProvisioning.name,
        vertical,
      );
    }

    const issuer = process.env[`${prefix}_ISSUER`]?.trim();
    const clientId = process.env[`${prefix}_CLIENT_ID`]?.trim();
    const clientSecret = process.env[`${prefix}_CLIENT_SECRET`]?.trim();

    // Falha explícita e nomeada: sem isso o `fetch` iria para uma URL vazia e o erro
    // apareceria como "não foi possível falar com a vertical", escondendo a causa real.
    const missing = [
      issuer ? null : `${prefix}_ISSUER`,
      clientId ? null : `${prefix}_CLIENT_ID`,
      clientSecret ? null : `${prefix}_CLIENT_SECRET`,
    ].filter((name): name is string => name !== null);

    if (missing.length > 0) {
      throw new VerticalProvisioningError(
        HttpVerticalMemberProvisioning.name,
        vertical,
        `Credencial M2M da vertical ${vertical} não configurada: ${missing.join(', ')}.`,
        undefined,
      );
    }

    return {
      issuer: issuer as string,
      clientId: clientId as string,
      clientSecret: clientSecret as string,
    };
  }

  private baseUrl(vertical: string, context: string): string {
    const url = VERTICAL_BASE_URL[vertical]?.();
    if (!url) throw new VerticalNotSupportedError(context, vertical);
    // Aceita `http://host:3112` ou `http://host:3112/api` — o adapter sempre
    // prefixa `/api/v1/...`. Trailing `/api` duplicado gerava 404 no reset de senha.
    return url.replace(/\/$/, '').replace(/\/api$/i, '');
  }

  private async serviceToken(vertical: string): Promise<string> {
    const cached = this.tokens.get(vertical);
    if (cached && cached.expiresAtMs > Date.now() + 30_000) {
      return cached.value;
    }

    const { issuer, clientId, clientSecret } = this.m2mCredentials(vertical);
    const res = await fetch(`${issuer}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!res.ok) {
      throw new VerticalProvisioningError(
        HttpVerticalMemberProvisioning.name,
        vertical,
        `Não foi possível autenticar no realm da vertical ${vertical}.`,
        res.status,
      );
    }

    const data = (await res.json()) as {
      access_token: string;
      expires_in: number;
    };
    this.tokens.set(vertical, {
      value: data.access_token,
      expiresAtMs: Date.now() + data.expires_in * 1000,
    });
    return data.access_token;
  }

  private async call<T>(
    vertical: string,
    storeId: string,
    path: string,
    init: RequestInit,
    timeoutMs: number = REQUEST_TIMEOUT_MS,
  ): Promise<T> {
    const url = `${this.baseUrl(vertical, HttpVerticalMemberProvisioning.name)}${path}`;
    const token = await this.serviceToken(vertical);

    let res: Response;
    try {
      res = await fetch(url, {
        ...init,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Store-Id': storeId,
          ...(init.headers ?? {}),
        },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      // Vertical fora do ar precisa virar erro claro na tela, não membro fantasma.
      throw new VerticalProvisioningError(
        HttpVerticalMemberProvisioning.name,
        vertical,
        `Não foi possível falar com a vertical ${vertical}. Tente novamente.`,
        undefined,
      );
    }

    const text = await res.text();
    if (!res.ok) {
      throw new VerticalProvisioningError(
        HttpVerticalMemberProvisioning.name,
        vertical,
        extractMessage(text) ??
          `A vertical ${vertical} recusou a operação (${res.status}).`,
        res.status,
      );
    }

    return (text ? JSON.parse(text) : undefined) as T;
  }

  async listUnits(storeId: string, vertical: string): Promise<VerticalUnit[]> {
    // Só a clínica expõe unidades (`clinics`). Comércio/Imóveis/Beautiful não usam este fluxo no admin.
    if (
      vertical === 'Comércio' ||
      vertical === 'Imóveis' ||
      vertical === 'Beautiful'
    ) {
      throw new VerticalNotSupportedError(
        HttpVerticalMemberProvisioning.name,
        vertical,
      );
    }
    const body = await this.call<{
      items: Array<{ id: string; name: string; isRoot: boolean }>;
    }>(vertical, storeId, '/api/v1/clinics', { method: 'GET' });
    return body?.items ?? [];
  }

  async findOwner(
    storeId: string,
    vertical: string,
  ): Promise<VerticalMember | null> {
    if (
      vertical === 'Comércio' ||
      vertical === 'Imóveis' ||
      vertical === 'Beautiful'
    ) {
      try {
        return await this.call<VerticalMember>(
          vertical,
          storeId,
          `/api/v1/platform/stores/${storeId}/owner`,
          { method: 'GET' },
        );
      } catch (err) {
        if (err instanceof VerticalProvisioningError && err.status === 404) {
          return null;
        }
        throw err;
      }
    }

    // A clínica não expõe rota "dê-me o responsável": o jeito de descobrir quem é continua
    // sendo o `GET /api/v1/members` e o `organizationRole`. A filtragem fica aqui, no
    // adapter, para o resto do platform não ver a equipe inteira — ele não a gerencia.
    const body = await this.call<{ items?: VerticalMember[] }>(
      vertical,
      storeId,
      '/api/v1/members',
      { method: 'GET' },
    );
    return body?.items?.find((m) => m.organizationRole === 'OWNER') ?? null;
  }

  async createMember(
    input: CreateVerticalMemberInput,
  ): Promise<CreateVerticalMemberResult> {
    if (
      input.vertical === 'Comércio' ||
      input.vertical === 'Imóveis' ||
      input.vertical === 'Beautiful'
    ) {
      throw new VerticalNotSupportedError(
        HttpVerticalMemberProvisioning.name,
        input.vertical,
      );
    }
    const body = await this.call<{
      id: string;
      username: string;
      provisionalPassword: string;
    }>(input.vertical, input.storeId, '/api/v1/members', {
      method: 'POST',
      body: JSON.stringify({
        firstName: input.firstName,
        lastName: input.lastName,
        username: input.username,
        email: input.email ?? undefined,
        clinics: input.assignments.map((a) => ({
          clinicId: a.clinicId,
          role: a.role,
        })),
      }),
    });

    return {
      memberId: body.id,
      username: body.username,
      provisionalPassword: body.provisionalPassword,
    };
  }

  async resetOwnerPassword(
    storeId: string,
    vertical: string,
  ): Promise<ResetVerticalOwnerPasswordResult> {
    if (
      vertical === 'Comércio' ||
      vertical === 'Imóveis' ||
      vertical === 'Beautiful'
    ) {
      const body = await this.call<{
        username: string;
        provisionalPassword: string;
      }>(
        vertical,
        storeId,
        `/api/v1/platform/stores/${storeId}/owner/reset-password`,
        { method: 'POST' },
      );
      return {
        memberId: storeId,
        username: body.username,
        provisionalPassword: body.provisionalPassword,
      };
    }

    // Quem sabe quem é o responsável é a vertical, dona da equipe — o platform não guarda
    // cópia de escrita desses membros (decisão D1). Daí a descoberta pelo próprio
    // `organizationRole` que a listagem expõe, em vez de um id guardado aqui.
    const owner = await this.findOwner(storeId, vertical);
    if (!owner) {
      throw new VerticalOwnerNotFoundError(
        HttpVerticalMemberProvisioning.name,
        storeId,
      );
    }

    const body = await this.call<{
      username: string;
      provisionalPassword: string;
    }>(vertical, storeId, `/api/v1/members/${owner.id}/reset-password`, {
      method: 'POST',
    });

    return {
      memberId: owner.id,
      username: body.username,
      provisionalPassword: body.provisionalPassword,
    };
  }

  async provisionStore(
    input: ProvisionVerticalStoreInput,
  ): Promise<ProvisionVerticalStoreResult> {
    this.baseUrl(input.vertical, HttpVerticalMemberProvisioning.name);
    const body = await this.call<{
      username: string;
      provisionalPassword: string;
    }>(
      input.vertical,
      input.storeId,
      `/api/v1/platform/stores/${input.storeId}/provision`,
      {
        method: 'POST',
        body: JSON.stringify(input.event),
      },
      PROVISION_TIMEOUT_MS,
    );
    return {
      username: body.username,
      provisionalPassword: body.provisionalPassword,
    };
  }
}

/** A vertical devolve `{ error: { message } }` ou `{ message }` conforme o filtro. */
function extractMessage(text: string): string | null {
  try {
    const data = JSON.parse(text) as {
      error?: { message?: string } | string;
      message?: string;
    };
    if (typeof data.error === 'string') return data.error;
    if (data.error?.message) return data.error.message;
    if (data.message) return data.message;
  } catch {
    // corpo não-JSON (ex.: 502 do nginx)
  }
  return null;
}
