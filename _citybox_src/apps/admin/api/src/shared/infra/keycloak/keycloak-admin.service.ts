import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

export type KeycloakUserSummary = {
  sub: string;
  email: string | null;
  displayName: string | null;
};

type KeycloakRealmConfig = {
  serverUrl: string;
  realm: string;
};

function parseIssuer(issuer: string): KeycloakRealmConfig {
  const match = issuer.match(/^(.*)\/realms\/([^/]+)$/);
  if (!match) {
    throw new ServiceUnavailableException('KEYCLOAK_ISSUER inválido');
  }
  return { serverUrl: match[1], realm: match[2] };
}

const KC_DEFAULT_TIMEOUT_MS = 15_000;
const KC_EMAIL_ACTION_TIMEOUT_MS = 60_000;

/**
 * O convite (`execute-actions-email`) agora leva o convidado ao **admin-web**, e
 * não mais ao backoffice do lojista: depois do ADR C-16 este serviço só toca
 * usuários do realm `citybox-admin`, que é a equipe interna Citybox.
 * O `client_id` do link vem de `KEYCLOAK_CLIENT_ID` (= `admin-web`).
 */
const DEFAULT_INVITE_REDIRECT_URI = 'https://admin.citybox.com/auth/callback';
const INVITE_REDIRECT_ALLOW = /^https:\/\/admin\.[a-z0-9.-]+\/auth\/callback$/i;
const INVITE_REDIRECT_ALLOW_DEV =
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/auth\/callback$/i;

function isFetchTimeout(err: unknown): boolean {
  return (
    (err instanceof DOMException && err.name === 'TimeoutError') ||
    (err instanceof Error && err.name === 'TimeoutError')
  );
}

function displayNameFromKeycloak(user: Record<string, unknown>): string | null {
  const first = typeof user.firstName === 'string' ? user.firstName.trim() : '';
  const last = typeof user.lastName === 'string' ? user.lastName.trim() : '';
  const full = [first, last].filter(Boolean).join(' ');
  if (full) return full;
  const username =
    typeof user.username === 'string' ? user.username.trim() : '';
  return username || null;
}

export type CreateStoreBackofficeUserInput = {
  username: string;
  email?: string | null;
  firstName: string;
  lastName: string;
  /** Conta provisionada pelo admin — evita VERIFY_EMAIL no primeiro login SSO */
  emailVerified?: boolean;
};

export type CreateStoreBackofficeUserResult = {
  sub: string;
  created: boolean;
};

/**
 * Admin REST do Keycloak restrito ao realm **`citybox-admin`** (ADR C-16).
 *
 * Antes deste ADR o serviço usava o service account global `citybox-core-admin`
 * e podia fazer `PUT /users/{id}`, `reset-password` e `logout` em usuários de
 * **todos** os sistemas — o defeito D3. Agora a credencial é
 * `admin-provisioning`, que só tem `manage-users` no próprio realm, e o alcance
 * do serviço é a **equipe interna Citybox**.
 *
 * A gestão de membros das verticais (lojistas) passa 100% pelo M2M
 * `admin-api → vertical-api` — ver `TODO(F2)` nos use cases de `stores`.
 */
@Injectable()
export class KeycloakAdminService {
  private readonly logger = new Logger(KeycloakAdminService.name);
  private tokenCache: { token: string; expiresAt: number } | null = null;
  private tokenInflight: Promise<string> | null = null;

  /**
   * Issuer do Admin REST + client_credentials — **o realm do próprio sistema**.
   *
   * Issuer único, sem `KEYCLOAK_INTERNAL_ISSUER` (ADR C-17, bloco 1): um realm
   * por sistema significa um issuer por sistema, e a divergência público/interno
   * existia só para o realm compartilhado `citybox-dev`.
   *
   * Lê o env direto em vez de importar `requiredIssuer()` de `keycloak-jwt.ts`:
   * aquele módulo importa `jose` (ESM puro), e o Jest deste app não transforma
   * `node_modules`. Puxá-lo para cá quebrava toda suíte que só usa o Admin REST.
   */
  private getAdminApiIssuer(): string {
    const issuer = process.env.KEYCLOAK_ISSUER?.trim();
    if (!issuer) throw new Error('KEYCLOAK_ISSUER não configurado');
    return issuer;
  }

  /**
   * Credencial `admin-provisioning` — service account do realm `citybox-admin`,
   * com `manage-users` **apenas nele**. Substitui o `citybox-core-admin` global,
   * que dava a seis APIs poder de escrita sobre os usuários de todos os sistemas
   * (defeito D3 do ADR C-16).
   */
  private getClientCredentials(): {
    clientId: string;
    clientSecret: string;
  } | null {
    const clientId = process.env.KEYCLOAK_PROVISIONING_CLIENT_ID;
    const clientSecret = process.env.KEYCLOAK_PROVISIONING_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;
    return { clientId, clientSecret };
  }

  isConfigured(): boolean {
    return this.getClientCredentials() !== null;
  }

  private async getAdminToken(): Promise<string> {
    const creds = this.getClientCredentials();
    if (!creds) {
      throw new ServiceUnavailableException(
        'Convites indisponíveis: configure KEYCLOAK_PROVISIONING_CLIENT_ID e KEYCLOAK_PROVISIONING_CLIENT_SECRET',
      );
    }
    if (this.tokenCache && this.tokenCache.expiresAt > Date.now() + 30_000) {
      return this.tokenCache.token;
    }
    if (!this.tokenInflight) {
      this.tokenInflight = this.fetchAdminToken(creds).finally(() => {
        this.tokenInflight = null;
      });
    }
    return this.tokenInflight;
  }

  private async fetchAdminToken(creds: {
    clientId: string;
    clientSecret: string;
  }): Promise<string> {
    const { serverUrl, realm } = parseIssuer(this.getAdminApiIssuer());
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
    });
    const res = await fetch(
      `${serverUrl}/realms/${realm}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: AbortSignal.timeout(KC_DEFAULT_TIMEOUT_MS),
      },
    );
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      this.logger.error(
        `Token admin Keycloak falhou (${res.status}): ${detail.slice(0, 300)}`,
      );
      throw new ServiceUnavailableException(
        'Falha ao obter token admin do Keycloak',
      );
    }
    const data = (await res.json()) as {
      access_token: string;
      expires_in?: number;
    };
    const expiresIn = (data.expires_in ?? 60) * 1000;
    this.tokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + expiresIn,
    };
    return data.access_token;
  }

  private adminBase(): string {
    const { serverUrl, realm } = parseIssuer(this.getAdminApiIssuer());
    return `${serverUrl}/admin/realms/${realm}`;
  }

  private inviteRedirectUri(): string {
    const uri =
      process.env.KEYCLOAK_INVITE_REDIRECT_URI?.trim() ||
      DEFAULT_INVITE_REDIRECT_URI;
    if (
      !INVITE_REDIRECT_ALLOW.test(uri) &&
      !INVITE_REDIRECT_ALLOW_DEV.test(uri)
    ) {
      throw new ServiceUnavailableException(
        'KEYCLOAK_INVITE_REDIRECT_URI inválido para convite',
      );
    }
    return uri;
  }

  private toSummary(user: Record<string, unknown>): KeycloakUserSummary {
    const sub = typeof user.id === 'string' ? user.id : '';
    const email = typeof user.email === 'string' ? user.email : null;
    return { sub, email, displayName: displayNameFromKeycloak(user) };
  }

  async findUserByEmail(email: string): Promise<KeycloakUserSummary | null> {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return null;
    const token = await this.getAdminToken();
    const url = `${this.adminBase()}/users?email=${encodeURIComponent(normalized)}&exact=true`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(KC_DEFAULT_TIMEOUT_MS),
    });
    if (!res.ok) {
      throw new ServiceUnavailableException(
        'Falha ao buscar usuário no Keycloak',
      );
    }
    const users = (await res.json()) as Array<Record<string, unknown>>;
    const match = users.find(
      (u) =>
        typeof u.email === 'string' &&
        u.email.trim().toLowerCase() === normalized,
    );
    return match ? this.toSummary(match) : null;
  }

  async findOrInviteUserByEmail(
    email: string,
    opts?: { firstName?: string; lastName?: string },
  ): Promise<{ sub: string; created: boolean; inviteEmailSent: boolean }> {
    const normalized = email.trim().toLowerCase();
    if (!normalized || !normalized.includes('@')) {
      throw new BadRequestException('E-mail inválido');
    }

    const existing = await this.findUserByEmail(normalized);
    if (existing?.sub) {
      return { sub: existing.sub, created: false, inviteEmailSent: false };
    }

    const token = await this.getAdminToken();
    const createRes = await fetch(`${this.adminBase()}/users`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: normalized,
        username: normalized,
        enabled: true,
        emailVerified: false,
        ...(opts?.firstName ? { firstName: opts.firstName } : {}),
        ...(opts?.lastName ? { lastName: opts.lastName } : {}),
      }),
      signal: AbortSignal.timeout(KC_DEFAULT_TIMEOUT_MS),
    });

    if (createRes.status === 409) {
      const again = await this.findUserByEmail(normalized);
      if (again?.sub)
        return { sub: again.sub, created: false, inviteEmailSent: false };
      throw new ServiceUnavailableException(
        'Usuário já existe no Keycloak, mas não foi possível vincular',
      );
    }

    if (!createRes.ok) {
      const detail = await createRes.text().catch(() => '');
      this.logger.error(
        `Criar usuário Keycloak falhou (${createRes.status}): ${detail.slice(0, 300)}`,
      );
      throw new ServiceUnavailableException(
        'Não foi possível criar usuário no Keycloak',
      );
    }

    const location = createRes.headers.get('location') ?? '';
    let sub = location.split('/').pop()?.trim();
    if (!sub) {
      const created = await this.findUserByEmail(normalized);
      if (!created?.sub) {
        throw new ServiceUnavailableException(
          'Usuário criado no Keycloak, mas ID não retornado',
        );
      }
      sub = created.sub;
    }

    const inviteEmailSent = await this.sendUpdatePasswordEmail(sub, token);
    return { sub, created: true, inviteEmailSent };
  }

  async resendUserInvite(userId: string): Promise<void> {
    const token = await this.getAdminToken();
    // Invalidate all previously issued action tokens by advancing notBefore to now.
    // Keycloak rejects any token whose iat < user.notBefore.
    await this.revokeUserTokens(userId, token);
    const sent = await this.sendUpdatePasswordEmail(userId, token);
    if (!sent) {
      throw new ServiceUnavailableException(
        'Falha ao reenviar convite por e-mail',
      );
    }
  }

  private async revokeUserTokens(userId: string, token: string): Promise<void> {
    // notBefore invalidates access/refresh tokens for active sessions but NOT execute-actions-email
    // tokens (Keycloak limitation — action tokens have their own validation path and ignore notBefore).
    // Old invite links expire only via their configured lifespan (INVITE_LIFESPAN_SECONDS).
    const notBefore = Math.floor(Date.now() / 1000);
    const updateRes = await fetch(`${this.adminBase()}/users/${userId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notBefore }),
      signal: AbortSignal.timeout(KC_DEFAULT_TIMEOUT_MS),
    });
    if (!updateRes.ok) {
      const detail = await updateRes.text().catch(() => '');
      this.logger.warn(
        `Revogar tokens do usuário ${userId} falhou (${updateRes.status}): ${detail.slice(0, 200)}`,
      );
    }
    await fetch(`${this.adminBase()}/users/${userId}/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(KC_DEFAULT_TIMEOUT_MS),
    }).catch(() => null);
  }

  private async sendUpdatePasswordEmail(
    userId: string,
    token: string,
  ): Promise<boolean> {
    const INVITE_LIFESPAN_SECONDS = 3600; // 1 hour — matches realm actionTokenGeneratedByAdminLifespan
    try {
      const redirectUri = encodeURIComponent(this.inviteRedirectUri());
      // O convite é da equipe interna e volta para o admin-web — o `client_id`
      // precisa ser um client do realm `citybox-admin` com essa redirect URI.
      const clientId = process.env.KEYCLOAK_CLIENT_ID?.trim();
      if (!clientId) {
        throw new ServiceUnavailableException(
          'KEYCLOAK_CLIENT_ID não configurado — convite não pode ser enviado',
        );
      }
      const res = await fetch(
        `${this.adminBase()}/users/${userId}/execute-actions-email?client_id=${encodeURIComponent(clientId)}&redirect_uri=${redirectUri}&lifespan=${INVITE_LIFESPAN_SECONDS}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(['UPDATE_PASSWORD', 'VERIFY_EMAIL']),
          signal: AbortSignal.timeout(KC_EMAIL_ACTION_TIMEOUT_MS),
        },
      );
      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        this.logger.error(
          `execute-actions-email falhou (${res.status}): ${detail.slice(0, 300)}`,
        );
        throw new ServiceUnavailableException(
          'Usuário criado, mas falha ao enviar convite por e-mail',
        );
      }
      return true;
    } catch (err) {
      if (isFetchTimeout(err)) return false;
      throw err;
    }
  }

  /**
   * Atribui uma realm role **do realm `citybox-admin`**: `platform_admin` ou
   * `platform_operator`. As antigas `store_staff` e `vertical.*.view` não
   * existem mais — com um realm por sistema, estar no realm já é o gate de
   * acesso (ADR C-16, §"O que desaparece").
   */
  async ensureRealmRole(userId: string, roleName: string): Promise<void> {
    if (!userId || !roleName.trim()) return;
    const token = await this.getAdminToken();
    const roleRes = await fetch(
      `${this.adminBase()}/roles/${encodeURIComponent(roleName)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(KC_DEFAULT_TIMEOUT_MS),
      },
    );
    if (!roleRes.ok) {
      throw new ServiceUnavailableException(
        `Realm role "${roleName}" não encontrada no Keycloak`,
      );
    }
    const role = (await roleRes.json()) as Record<string, unknown>;
    const assignRes = await fetch(
      `${this.adminBase()}/users/${userId}/role-mappings/realm`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([role]),
        signal: AbortSignal.timeout(KC_DEFAULT_TIMEOUT_MS),
      },
    );
    if (!assignRes.ok) {
      const detail = await assignRes.text().catch(() => '');
      this.logger.error(
        `Atribuir realm role ${roleName} falhou (${assignRes.status}): ${detail.slice(0, 300)}`,
      );
      throw new ServiceUnavailableException(
        `Falha ao atribuir "${roleName}" no Keycloak`,
      );
    }
  }

  async resolveUsersBySubs(
    subs: string[],
  ): Promise<Map<string, KeycloakUserSummary>> {
    const unique = [...new Set(subs.filter(Boolean))];
    const map = new Map<string, KeycloakUserSummary>();
    if (unique.length === 0 || !this.isConfigured()) return map;

    const token = await this.getAdminToken();
    await Promise.all(
      unique.map(async (sub) => {
        try {
          const res = await fetch(`${this.adminBase()}/users/${sub}`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: AbortSignal.timeout(KC_DEFAULT_TIMEOUT_MS),
          });
          if (!res.ok) return;
          const user = (await res.json()) as Record<string, unknown>;
          map.set(sub, this.toSummary(user));
        } catch {
          // ignora falha individual
        }
      }),
    );
    return map;
  }

  async findUserByUsername(
    username: string,
  ): Promise<KeycloakUserSummary | null> {
    const normalized = username.trim().toLowerCase();
    if (!normalized) return null;
    const token = await this.getAdminToken();
    const url = `${this.adminBase()}/users?username=${encodeURIComponent(normalized)}&exact=true`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(KC_DEFAULT_TIMEOUT_MS),
    });
    if (!res.ok) {
      throw new ServiceUnavailableException(
        'Falha ao buscar usuário no Keycloak',
      );
    }
    const users = (await res.json()) as Array<Record<string, unknown>>;
    const match = users.find(
      (u) =>
        typeof u.username === 'string' &&
        u.username.trim().toLowerCase() === normalized,
    );
    return match ? this.toSummary(match) : null;
  }

  async findUserByEmailOrUsername(
    email?: string | null,
    username?: string | null,
  ): Promise<KeycloakUserSummary | null> {
    if (email?.trim()) {
      const byEmail = await this.findUserByEmail(email);
      if (byEmail) return byEmail;
    }
    if (username?.trim()) {
      return this.findUserByUsername(username);
    }
    return null;
  }

  async createStoreBackofficeUser(
    input: CreateStoreBackofficeUserInput,
  ): Promise<CreateStoreBackofficeUserResult> {
    const email = input.email?.trim().toLowerCase() || undefined;
    const username = input.username.trim().toLowerCase();
    if (!username) {
      throw new BadRequestException('Username inválido');
    }

    // Reuso só por e-mail — nunca por username curto com outro e-mail (colisão
    // `vendas@loja-a` vs `vendas@loja-b`).
    if (email) {
      const byEmail = await this.findUserByEmail(email);
      if (byEmail?.sub) {
        return { sub: byEmail.sub, created: false };
      }
    }

    const byUsername = await this.findUserByUsername(username);
    if (byUsername?.sub) {
      const existingEmail = byUsername.email?.trim().toLowerCase() ?? '';
      if (!email || existingEmail === email) {
        return { sub: byUsername.sub, created: false };
      }
      throw new BadRequestException(
        `Username Keycloak "${username}" já está em uso por outro e-mail. Use o e-mail completo como login.`,
      );
    }

    const token = await this.getAdminToken();
    const createRes = await fetch(`${this.adminBase()}/users`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        enabled: true,
        emailVerified: input.emailVerified ?? false,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        ...(email ? { email } : {}),
      }),
      signal: AbortSignal.timeout(KC_DEFAULT_TIMEOUT_MS),
    });

    if (createRes.status === 409) {
      if (email) {
        const again = await this.findUserByEmail(email);
        if (again?.sub) return { sub: again.sub, created: false };
      }
      const againUser = await this.findUserByUsername(username);
      if (againUser?.sub) {
        const existingEmail = againUser.email?.trim().toLowerCase() ?? '';
        if (!email || existingEmail === email) {
          return { sub: againUser.sub, created: false };
        }
      }
      throw new ServiceUnavailableException(
        'Usuário já existe no Keycloak, mas não foi possível vincular',
      );
    }

    if (!createRes.ok) {
      const detail = await createRes.text().catch(() => '');
      this.logger.error(
        `Criar usuário Keycloak falhou (${createRes.status}): ${detail.slice(0, 300)}`,
      );
      throw new ServiceUnavailableException(
        'Não foi possível criar usuário no Keycloak',
      );
    }

    const location = createRes.headers.get('location') ?? '';
    let sub = location.split('/').pop()?.trim();
    if (!sub) {
      const created = await this.findUserByUsername(username);
      if (!created?.sub) {
        throw new ServiceUnavailableException(
          'Usuário criado no Keycloak, mas ID não retornado',
        );
      }
      sub = created.sub;
    }

    return { sub, created: true };
  }

  /**
   * Senha provisória para primeiro acesso no admin-web.
   * Prepara o usuário (e-mail verificado, sem ações conflitantes) e exige UPDATE_PASSWORD no browser.
   */
  async setProvisionalPassword(
    userId: string,
    password: string,
  ): Promise<void> {
    const token = await this.getAdminToken();
    await this.revokeUserTokens(userId, token);
    await this.patchKeycloakUser(userId, token, {
      emailVerified: true,
      requiredActions: [],
    });

    const res = await fetch(
      `${this.adminBase()}/users/${userId}/reset-password`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'password',
          value: password,
          temporary: true,
        }),
        signal: AbortSignal.timeout(KC_DEFAULT_TIMEOUT_MS),
      },
    );
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      this.logger.error(
        `reset-password falhou (${res.status}): ${detail.slice(0, 300)}`,
      );
      throw new ServiceUnavailableException(
        'Falha ao definir senha provisória no Keycloak',
      );
    }

    await this.patchKeycloakUser(userId, token, {
      requiredActions: ['UPDATE_PASSWORD'],
    });
  }

  /** @deprecated Prefer setProvisionalPassword — mantido por compatibilidade interna */
  async setTemporaryPassword(userId: string, password: string): Promise<void> {
    return this.setProvisionalPassword(userId, password);
  }

  private async patchKeycloakUser(
    userId: string,
    token: string,
    patch: {
      email?: string;
      firstName?: string;
      lastName?: string;
      emailVerified?: boolean;
      requiredActions?: string[];
      enabled?: boolean;
    },
  ): Promise<void> {
    const getRes = await fetch(`${this.adminBase()}/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(KC_DEFAULT_TIMEOUT_MS),
    });
    if (!getRes.ok) {
      const detail = await getRes.text().catch(() => '');
      this.logger.error(
        `Buscar usuário Keycloak falhou (${getRes.status}): ${detail.slice(0, 300)}`,
      );
      throw new ServiceUnavailableException(
        'Falha ao preparar usuário no Keycloak',
      );
    }

    const user = (await getRes.json()) as Record<string, unknown>;
    const putRes = await fetch(`${this.adminBase()}/users/${userId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...user, ...patch }),
      signal: AbortSignal.timeout(KC_DEFAULT_TIMEOUT_MS),
    });
    if (!putRes.ok) {
      const detail = await putRes.text().catch(() => '');
      this.logger.error(
        `Atualizar usuário Keycloak falhou (${putRes.status}): ${detail.slice(0, 300)}`,
      );
      throw new ServiceUnavailableException(
        'Falha ao preparar usuário no Keycloak',
      );
    }
  }

  async sendInviteEmail(userId: string): Promise<boolean> {
    const token = await this.getAdminToken();
    return this.sendUpdatePasswordEmail(userId, token);
  }

  async updateUserProfile(
    userId: string,
    data: { firstName?: string; lastName?: string; email?: string },
  ): Promise<void> {
    if (
      data.firstName === undefined &&
      data.lastName === undefined &&
      data.email === undefined
    ) {
      return;
    }

    const token = await this.getAdminToken();
    await this.patchKeycloakUser(userId, token, {
      ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
      ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
      ...(data.email !== undefined ? { email: data.email } : {}),
    });
  }

  async setUserEnabled(userId: string, enabled: boolean): Promise<void> {
    const token = await this.getAdminToken();
    await this.patchKeycloakUser(userId, token, { enabled });
  }
}
