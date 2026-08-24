import { Injectable } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { config } from '../config.js';
import { ApiError, unauthorized } from '../common/envelope.js';

export interface KeycloakTokens {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

export interface KeycloakClaims extends JWTPayload {
  sub: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  phone_number?: string;
}

const form = (fields: Record<string, string | undefined>) => {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined) params.set(k, v);
  }
  return params;
};

/**
 * Mediação do Keycloak (ADR C-07): o app consumidor nunca fala com o Keycloak;
 * o BFF troca credenciais por tokens (Direct Access Grant) e usa o service
 * account `marketplace-provisioning` (manage-users limitado ao realm
 * `citybox-marketplace`) para registro/reset de senha.
 *
 * ⚠️ PENDÊNCIA DE INFRA: `marketplace-app` é público (sem secret) — por isso os
 * grants abaixo não enviam `client_secret` —, mas o JSON do realm em
 * `infra/keycloak/import/citybox-marketplace-realm.json` traz
 * `directAccessGrantsEnabled: false`. Com essa configuração o password/refresh
 * grant deste serviço responde 400 `unauthorized_client`. Ou o client passa a
 * ter `directAccessGrantsEnabled: true`, ou o BFF migra para authorization code
 * + PKCE (refactor de contrato, fora do escopo da T1.F). Ver AGENTS.md §10.
 */
@Injectable()
export class KeycloakService {
  private readonly kc = config.keycloak;
  private jwks = createRemoteJWKSet(
    new URL(`${this.kc.baseUrl}/realms/${this.kc.realm}/protocol/openid-connect/certs`),
  );

  private realmUrl(path: string) {
    return `${this.kc.baseUrl}/realms/${this.kc.realm}${path}`;
  }

  private adminUrl(path: string) {
    return `${this.kc.baseUrl}/admin/realms/${this.kc.realm}${path}`;
  }

  async verify(token: string): Promise<KeycloakClaims> {
    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: this.kc.issuer(),
      });
      if (!payload.sub) throw new Error('missing sub');
      return payload as KeycloakClaims;
    } catch {
      throw unauthorized('Token inválido ou expirado');
    }
  }

  async passwordGrant(username: string, password: string): Promise<KeycloakTokens> {
    const res = await fetch(this.realmUrl('/protocol/openid-connect/token'), {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: form({
        grant_type: 'password',
        client_id: this.kc.appClientId,
        username,
        password,
        scope: 'openid profile email',
      }),
    });
    if (!res.ok) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha inválidos');
    }
    return (await res.json()) as KeycloakTokens;
  }

  async refreshGrant(refreshToken: string): Promise<KeycloakTokens> {
    const res = await fetch(this.realmUrl('/protocol/openid-connect/token'), {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: form({
        grant_type: 'refresh_token',
        client_id: this.kc.appClientId,
        refresh_token: refreshToken,
      }),
    });
    if (!res.ok) throw unauthorized('Sessão expirada — faça login novamente');
    return (await res.json()) as KeycloakTokens;
  }

  async logout(refreshToken: string): Promise<void> {
    await fetch(this.realmUrl('/protocol/openid-connect/logout'), {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: form({
        client_id: this.kc.appClientId,
        refresh_token: refreshToken,
      }),
    }).catch(() => undefined);
  }

  private async adminToken(): Promise<string> {
    const res = await fetch(this.realmUrl('/protocol/openid-connect/token'), {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: form({
        grant_type: 'client_credentials',
        client_id: this.kc.provisioningClientId,
        client_secret: this.kc.provisioningClientSecret,
      }),
    });
    if (!res.ok) {
      throw new ApiError(503, 'AUTH_UNAVAILABLE', 'Registro indisponível no momento');
    }
    const body = (await res.json()) as KeycloakTokens;
    return body.access_token;
  }

  /** Cria usuário no realm e devolve o id Keycloak. 409 → e-mail já cadastrado. */
  async createUser(input: {
    email: string;
    password: string;
    firstName: string;
    lastName?: string;
    phone?: string;
  }): Promise<string> {
    const token = await this.adminToken();
    const res = await fetch(this.adminUrl('/users'), {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({
        username: input.email,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName ?? '',
        enabled: true,
        emailVerified: true,
        attributes: input.phone ? { phone_number: [input.phone] } : undefined,
        credentials: [{ type: 'password', value: input.password, temporary: false }],
      }),
    });
    if (res.status === 409) {
      throw new ApiError(409, 'EMAIL_TAKEN', 'Já existe uma conta com este e-mail', 'email');
    }
    if (!res.ok) {
      throw new ApiError(502, 'AUTH_ERROR', 'Falha ao criar usuário');
    }
    const location = res.headers.get('location') ?? '';
    const id = location.split('/').pop();
    if (!id) throw new ApiError(502, 'AUTH_ERROR', 'Keycloak não retornou o id do usuário');
    return id;
  }

  async findUserIdByEmail(email: string): Promise<string | null> {
    const token = await this.adminToken();
    const res = await fetch(
      this.adminUrl(`/users?email=${encodeURIComponent(email)}&exact=true`),
      { headers: { authorization: `Bearer ${token}` } },
    );
    if (!res.ok) return null;
    const users = (await res.json()) as Array<{ id: string }>;
    return users[0]?.id ?? null;
  }

  async setUserPassword(keycloakId: string, password: string): Promise<void> {
    const token = await this.adminToken();
    const res = await fetch(this.adminUrl(`/users/${keycloakId}/reset-password`), {
      method: 'PUT',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ type: 'password', value: password, temporary: false }),
    });
    if (!res.ok) throw new ApiError(502, 'AUTH_ERROR', 'Falha ao redefinir senha');
  }

  async deleteUser(keycloakId: string): Promise<void> {
    const token = await this.adminToken();
    await fetch(this.adminUrl(`/users/${keycloakId}`), {
      method: 'DELETE',
      headers: { authorization: `Bearer ${token}` },
    }).catch(() => undefined);
  }
}
