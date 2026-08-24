/// <reference types="node" />
import { Injectable, Logger } from '@nestjs/common';

export type KeycloakProvisioningConfig = {
  /** Realm do próprio sistema. Ex.: http://127.0.0.1:8080/realms/citybox-clinica */
  issuer: string;
  /** `KEYCLOAK_PROVISIONING_CLIENT_ID` — service account `clinica-provisioning`. */
  clientId: string;
  /** `KEYCLOAK_PROVISIONING_CLIENT_SECRET`. */
  clientSecret: string;
};

export type ProvisionMemberInput = {
  username: string;
  firstName: string;
  lastName: string;
  email?: string | null;
};

export type ProvisionMemberResult = {
  keycloakSub: string;
  /** Só presente quando uma senha provisória foi gerada agora. */
  provisionalPassword?: string;
  /** true quando o usuário já existia no Keycloak e foi reaproveitado. */
  reused: boolean;
};

export class KeycloakProvisioningError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'KeycloakProvisioningError';
  }
}

const TOKEN_SLACK_MS = 30_000;

/** Subset de `RequestInit` — evita depender de lib DOM neste serviço Nest/Node. */
type AdminFetchInit = {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
};

/**
 * Provisionamento de usuário no Keycloak da clínica.
 *
 * ## Por que é uma cópia local
 *
 * Até 2026-08-13 isto vinha de `@citybox/nest-common`, compartilhado com as outras
 * verticais e com o admin. Com um realm por sistema (ADR C-16) a decisão explícita
 * foi **não** ter pacote compartilhado de autenticação: cada sistema mantém a sua
 * cópia, e o molde canônico é o ADR C-17 (bloco 5). A duplicação é intencional.
 *
 * ## O que mudou em relação ao original
 *
 * 1. `provisionMember()` perdeu `verticalRole` / `realmRole` — as client roles
 *    `vertical.*.view` e a realm role `store_staff` deixaram de existir. **Estar no
 *    realm `citybox-clinica` já é o gate de acesso.**
 * 2. A credencial é `clinica-provisioning` (`manage-users` só neste realm), e não
 *    mais o `citybox-core-admin` global que ficava no `.env` de seis APIs (defeito
 *    D3 do ADR C-16).
 *
 * ## O que NÃO faz
 *
 * Não persiste nada: quem grava o `Member` é a clínica, que também é dona da decisão
 * de rollback se a persistência falhar depois do provisionamento.
 */
@Injectable()
export class KeycloakProvisioningService {
  private readonly logger = new Logger(KeycloakProvisioningService.name);
  private token: { value: string; expiresAtMs: number } | null = null;

  constructor(private readonly config: KeycloakProvisioningConfig) {}

  private get adminBase(): string {
    const match = /^(.*)\/realms\/([^/]+)$/.exec(this.config.issuer);
    if (!match) {
      throw new KeycloakProvisioningError(
        `KEYCLOAK_ISSUER inválido: ${this.config.issuer}`,
      );
    }
    return `${match[1]}/admin/realms/${match[2]}`;
  }

  private async getToken(): Promise<string> {
    if (this.token && this.token.expiresAtMs > Date.now() + TOKEN_SLACK_MS) {
      return this.token.value;
    }

    const res = await fetch(
      `${this.config.issuer}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
        }),
      },
    );

    if (!res.ok) {
      throw new KeycloakProvisioningError(
        `Falha ao obter token de provisionamento do Keycloak: ${res.status}`,
        res.status,
      );
    }

    const data = (await res.json()) as {
      access_token: string;
      expires_in: number;
    };
    this.token = {
      value: data.access_token,
      expiresAtMs: Date.now() + data.expires_in * 1000,
    };
    return data.access_token;
  }

  private async admin<T>(
    path: string,
    init: AdminFetchInit = {},
  ): Promise<{ status: number; body: T | null; location: string | null }> {
    const token = await this.getToken();
    const res = await fetch(`${this.adminBase}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    });

    const text = await res.text();
    let body: T | null = null;
    if (text) {
      try {
        body = JSON.parse(text) as T;
      } catch {
        body = null;
      }
    }
    return { status: res.status, body, location: res.headers.get('location') };
  }

  isConfigured(): boolean {
    return Boolean(
      this.config.issuer && this.config.clientId && this.config.clientSecret,
    );
  }

  async findUserByUsernameOrEmail(
    identifier: string,
  ): Promise<{ id: string; username: string } | null> {
    const query = encodeURIComponent(identifier);
    const { body } = await this.admin<Array<{ id: string; username: string }>>(
      `/users?exact=true&username=${query}`,
    );
    if (body?.length) return body[0];

    const byEmail = await this.admin<Array<{ id: string; username: string }>>(
      `/users?exact=true&email=${query}`,
    );
    return byEmail.body?.length ? byEmail.body[0] : null;
  }

  /**
   * Resolve usuário existente por username **ou** e-mail.
   *
   * O Keycloak devolve 409 em create tanto por username quanto por e-mail único. Se a
   * busca prévia olhasse só o username, um e-mail já cadastrado sob outro username
   * (loja anterior, retry, outra vertical) estourava "409 mas não encontrado".
   */
  private async resolveExistingUser(
    username: string,
    email?: string | null,
  ): Promise<{ id: string; username: string } | null> {
    const byUsername = await this.findUserByUsernameOrEmail(username);
    if (byUsername) return byUsername;
    const normalizedEmail = email?.trim();
    if (!normalizedEmail || normalizedEmail === username) return null;
    return this.findUserByUsernameOrEmail(normalizedEmail);
  }

  /** Cria (ou reaproveita) o usuário no realm da clínica e devolve o `sub`. */
  async provisionMember(
    input: ProvisionMemberInput,
  ): Promise<ProvisionMemberResult> {
    const existing = await this.resolveExistingUser(input.username, input.email);

    if (existing) {
      // Reuso de conta que ficou desabilitada (ex.: soft-delete anterior) precisa
      // voltar a enabled=true — senão o login devolve accountDisabledMessage.
      await this.setUserEnabled(existing.id, true).catch((err) => {
        this.logger.warn(
          `Não foi possível reabilitar usuário reutilizado ${existing.id}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      });
      return { keycloakSub: existing.id, reused: true };
    }

    const created = await this.admin<unknown>('/users', {
      method: 'POST',
      body: JSON.stringify({
        username: input.username,
        firstName: input.firstName,
        lastName: input.lastName,
        ...(input.email ? { email: input.email } : {}),
        enabled: true,
        emailVerified: false,
      }),
    });

    if (created.status === 409) {
      // Corrida ou conflito de e-mail/username: reaproveita o usuário já existente.
      const resolved = await this.resolveExistingUser(
        input.username,
        input.email,
      );
      if (!resolved) {
        throw new KeycloakProvisioningError(
          `Keycloak devolveu 409 para ${input.username} mas o usuário não foi encontrado`,
          409,
        );
      }
      return { keycloakSub: resolved.id, reused: true };
    }

    if (created.status >= 400) {
      throw new KeycloakProvisioningError(
        `Falha ao criar usuário ${input.username}: ${created.status}`,
        created.status,
      );
    }

    const fromLocation = created.location?.split('/').pop();
    if (fromLocation) {
      return { keycloakSub: fromLocation, reused: false };
    }

    const resolved = await this.resolveExistingUser(input.username, input.email);
    if (!resolved) {
      throw new KeycloakProvisioningError(
        `Usuário ${input.username} criado mas o sub não pôde ser resolvido`,
      );
    }
    return { keycloakSub: resolved.id, reused: false };
  }

  /**
   * @param options.temporary — default `true` (Keycloak exige UPDATE_PASSWORD).
   *   Use `false` quando a senha é só exibida no app e a troca forçada fica a cargo
   *   do admin da plataforma.
   */
  async setProvisionalPassword(
    keycloakSub: string,
    password: string,
    options?: { temporary?: boolean },
  ): Promise<void> {
    const temporary = options?.temporary ?? true;
    const res = await this.admin(`/users/${keycloakSub}/reset-password`, {
      method: 'PUT',
      body: JSON.stringify({ type: 'password', value: password, temporary }),
    });
    if (res.status >= 400) {
      throw new KeycloakProvisioningError(
        `Falha ao definir senha provisória: ${res.status}`,
        res.status,
      );
    }
    if (temporary) {
      await this.patchUser(keycloakSub, {
        requiredActions: ['UPDATE_PASSWORD'],
      }).catch(() => {
        // alguns realms já marcam a action no reset temporary; não bloqueia
      });
    } else {
      await this.patchUser(keycloakSub, { requiredActions: [] }).catch(
        () => undefined,
      );
    }
  }

  /**
   * Keycloak Admin `PUT /users/{id}` trata o body como representação completa:
   * enviar só `{ enabled }` ou só campos de perfil pode zerar o resto (inclusive
   * `enabled: false` implícito). Sempre GET → merge → PUT.
   */
  private async patchUser(
    keycloakSub: string,
    patch: Record<string, unknown>,
  ): Promise<void> {
    const { body: existing, status } = await this.admin<Record<string, unknown>>(
      `/users/${keycloakSub}`,
    );
    if (status >= 400 || !existing) {
      throw new KeycloakProvisioningError(
        `Usuário ${keycloakSub} não encontrado no Keycloak: ${status}`,
        status,
      );
    }

    const res = await this.admin(`/users/${keycloakSub}`, {
      method: 'PUT',
      body: JSON.stringify({ ...existing, ...patch }),
    });
    if (res.status >= 400) {
      throw new KeycloakProvisioningError(
        `Falha ao atualizar usuário ${keycloakSub}: ${res.status}`,
        res.status,
      );
    }
  }

  async setUserEnabled(keycloakSub: string, enabled: boolean): Promise<void> {
    await this.patchUser(keycloakSub, { enabled });
  }

  async updateProfile(
    keycloakSub: string,
    profile: { firstName?: string; lastName?: string; email?: string | null },
  ): Promise<void> {
    const patch: Record<string, unknown> = {};
    if (profile.firstName !== undefined) patch.firstName = profile.firstName;
    if (profile.lastName !== undefined) patch.lastName = profile.lastName;
    if (profile.email !== undefined) patch.email = profile.email;
    if (Object.keys(patch).length === 0) return;
    await this.patchUser(keycloakSub, patch);
  }
}
