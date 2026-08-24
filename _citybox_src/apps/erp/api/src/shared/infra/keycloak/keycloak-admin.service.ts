import { Injectable, Logger } from '@nestjs/common';
import { KeycloakUnavailableError } from './keycloak-unavailable.error';

export type KeycloakUserSummary = {
  sub: string;
  email: string | null;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  enabled: boolean;
};

export type CreateKeycloakUserInput = {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
};

const DEFAULT_TIMEOUT_MS = 15_000;
/** Margem para não usar um token que expira no meio da chamada seguinte. */
const TOKEN_EXPIRY_MARGIN_MS = 30_000;

function parseIssuer(issuer: string): { serverUrl: string; realm: string } {
  const match = issuer.match(/^(.*)\/realms\/([^/]+)$/);
  if (!match) {
    throw new KeycloakUnavailableError(
      `KEYCLOAK_ISSUER inválido: ${issuer}`,
      'Integração com o Keycloak mal configurada',
    );
  }
  return { serverUrl: match[1], realm: match[2] };
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/**
 * Cliente da Admin API do Keycloak — só identidade.
 *
 * Papéis e permissões do ERP NÃO passam por aqui: quem autoriza é o
 * `Membership` no banco do ERP (ver `AGENTS.md` §5.10). O Keycloak guarda quem
 * é a pessoa; o ERP guarda o que ela pode fazer.
 *
 * Autentica com a credencial `erp-provisioning`
 * (`KEYCLOAK_PROVISIONING_CLIENT_ID` / `_SECRET`), cujo `manage-users` é
 * limitado ao realm `citybox-erp` — ADR C-16, invariante 2. A credencial global
 * que gerenciava usuários de todos os sistemas não existe mais.
 */
@Injectable()
export class KeycloakAdminService {
  private readonly logger = new Logger(KeycloakAdminService.name);
  private tokenCache: { token: string; expiresAt: number } | null = null;
  private tokenInflight: Promise<string> | null = null;

  private getIssuer(): string {
    const issuer = process.env.KEYCLOAK_ISSUER?.trim();
    if (!issuer) {
      throw new KeycloakUnavailableError(
        'KEYCLOAK_ISSUER não configurado',
        'Integração com o Keycloak mal configurada',
      );
    }
    return issuer;
  }

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

  private adminBase(): string {
    const { serverUrl, realm } = parseIssuer(this.getIssuer());
    return `${serverUrl}/admin/realms/${realm}`;
  }

  private async getAdminToken(): Promise<string> {
    const credentials = this.getClientCredentials();
    if (!credentials) {
      throw new KeycloakUnavailableError(
        'KEYCLOAK_PROVISIONING_CLIENT_ID/KEYCLOAK_PROVISIONING_CLIENT_SECRET ausentes',
        'Cadastro de usuários indisponível: integração com o Keycloak não configurada',
      );
    }
    if (
      this.tokenCache &&
      this.tokenCache.expiresAt > Date.now() + TOKEN_EXPIRY_MARGIN_MS
    ) {
      return this.tokenCache.token;
    }
    // Dedupe: várias requisições simultâneas pedindo token renovariam o mesmo
    // token N vezes.
    if (!this.tokenInflight) {
      this.tokenInflight = this.fetchAdminToken(credentials).finally(() => {
        this.tokenInflight = null;
      });
    }
    return this.tokenInflight;
  }

  private async fetchAdminToken(credentials: {
    clientId: string;
    clientSecret: string;
  }): Promise<string> {
    const { serverUrl, realm } = parseIssuer(this.getIssuer());
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
    });

    const res = await fetch(
      `${serverUrl}/realms/${realm}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      },
    );

    if (!res.ok) {
      await this.failFromResponse(
        res,
        'Token admin do Keycloak',
        'Falha ao autenticar no Keycloak',
      );
    }

    const data = (await res.json()) as {
      access_token: string;
      expires_in?: number;
    };
    this.tokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in ?? 60) * 1000,
    };
    return data.access_token;
  }

  /** Loga o corpo do Keycloak truncado e devolve erro genérico ao cliente. */
  private async failFromResponse(
    res: Response,
    operation: string,
    externalMessage: string,
  ): Promise<never> {
    const detail = await res.text().catch(() => '');
    this.logger.error(
      `${operation} falhou (${res.status}): ${detail.slice(0, 300)}`,
    );
    throw new KeycloakUnavailableError(
      `${operation} falhou com status ${res.status}`,
      externalMessage,
    );
  }

  private toSummary(user: Record<string, unknown>): KeycloakUserSummary {
    return {
      sub: readString(user.id) ?? '',
      email: readString(user.email),
      username: readString(user.username),
      firstName: readString(user.firstName),
      lastName: readString(user.lastName),
      enabled: user.enabled !== false,
    };
  }

  async findUserByEmail(email: string): Promise<KeycloakUserSummary | null> {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return null;

    const token = await this.getAdminToken();
    const res = await fetch(
      `${this.adminBase()}/users?email=${encodeURIComponent(normalized)}&exact=true`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      },
    );
    if (!res.ok) {
      await this.failFromResponse(
        res,
        'Buscar usuário no Keycloak',
        'Falha ao consultar o Keycloak',
      );
    }

    const users = (await res.json()) as Array<Record<string, unknown>>;
    const match = users.find(
      (user) => readString(user.email)?.toLowerCase() === normalized,
    );
    return match ? this.toSummary(match) : null;
  }

  /**
   * Cria a identidade. Idempotente: se o e-mail já existe no realm, devolve o
   * `sub` existente com `created: false` — o membro passa a ser um vínculo novo
   * para uma pessoa que já usava a plataforma.
   */
  async createUser(
    input: CreateKeycloakUserInput,
  ): Promise<{ sub: string; created: boolean }> {
    const email = input.email.trim().toLowerCase();
    const username = input.username.trim().toLowerCase() || email;

    const existing = await this.findUserByEmail(email);
    if (existing?.sub) return { sub: existing.sub, created: false };

    const token = await this.getAdminToken();
    const res = await fetch(`${this.adminBase()}/users`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        email,
        enabled: true,
        // Conta provisionada por um admin: exigir VERIFY_EMAIL travaria o
        // primeiro login, que já é protegido pela senha provisória.
        emailVerified: true,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
      }),
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    });

    if (res.status === 409) {
      const again = await this.findUserByEmail(email);
      if (again?.sub) return { sub: again.sub, created: false };
      throw new KeycloakUnavailableError(
        `Keycloak devolveu 409 para ${email}, mas o usuário não foi encontrado`,
        'Usuário já existe no Keycloak, mas não foi possível vinculá-lo',
      );
    }

    if (!res.ok) {
      await this.failFromResponse(
        res,
        'Criar usuário no Keycloak',
        'Não foi possível criar o usuário no Keycloak',
      );
    }

    const sub =
      res.headers.get('location')?.split('/').pop()?.trim() ||
      (await this.findUserByEmail(email))?.sub;
    if (!sub) {
      throw new KeycloakUnavailableError(
        `Usuário ${email} criado no Keycloak sem id retornado`,
        'Usuário criado no Keycloak, mas o identificador não foi retornado',
      );
    }

    return { sub, created: true };
  }

  /**
   * Define a senha de primeiro acesso e obriga a troca no login.
   *
   * A ordem importa: limpar `requiredActions` antes evita que uma ação
   * pendente (ex.: `VERIFY_EMAIL`) trave o fluxo, e reaplicar
   * `UPDATE_PASSWORD` depois garante a troca mesmo que o realm não a injete.
   */
  async setProvisionalPassword(sub: string, password: string): Promise<void> {
    const token = await this.getAdminToken();
    await this.patchUser(sub, token, {
      emailVerified: true,
      requiredActions: [],
    });

    const res = await fetch(`${this.adminBase()}/users/${sub}/reset-password`, {
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
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    });
    if (!res.ok) {
      await this.failFromResponse(
        res,
        'Definir senha provisória no Keycloak',
        'Falha ao definir a senha provisória',
      );
    }

    await this.patchUser(sub, token, {
      requiredActions: ['UPDATE_PASSWORD'],
    });
  }

  async setUserEnabled(sub: string, enabled: boolean): Promise<void> {
    const token = await this.getAdminToken();
    await this.patchUser(sub, token, { enabled });
  }

  async updateUserProfile(
    sub: string,
    data: { firstName?: string; lastName?: string; email?: string },
  ): Promise<void> {
    const token = await this.getAdminToken();
    await this.patchUser(sub, token, data);
  }

  /**
   * Remove a identidade. Usado como compensação quando a gravação local falha
   * depois de o usuário já existir no Keycloak — sem isso, sobraria uma conta
   * órfã que bloquearia a próxima tentativa com o mesmo e-mail.
   */
  async deleteUser(sub: string): Promise<void> {
    const token = await this.getAdminToken();
    const res = await fetch(`${this.adminBase()}/users/${sub}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    });
    if (!res.ok && res.status !== 404) {
      await this.failFromResponse(
        res,
        'Remover usuário do Keycloak',
        'Falha ao remover o usuário no Keycloak',
      );
    }
  }

  /**
   * O Keycloak não tem PATCH parcial em `/users/{id}`: o PUT substitui a
   * representação inteira. Daí o read-modify-write.
   */
  private async patchUser(
    sub: string,
    token: string,
    patch: Record<string, unknown>,
  ): Promise<void> {
    const getRes = await fetch(`${this.adminBase()}/users/${sub}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    });
    if (!getRes.ok) {
      await this.failFromResponse(
        getRes,
        'Buscar usuário no Keycloak',
        'Falha ao preparar o usuário no Keycloak',
      );
    }
    const user = (await getRes.json()) as Record<string, unknown>;

    const putRes = await fetch(`${this.adminBase()}/users/${sub}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...user, ...patch }),
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    });
    if (!putRes.ok) {
      await this.failFromResponse(
        putRes,
        'Atualizar usuário no Keycloak',
        'Falha ao atualizar o usuário no Keycloak',
      );
    }
  }
}
