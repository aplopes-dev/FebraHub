import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { keycloakIssuer } from '../common/auth/keycloak-jwt.js';

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

function splitDisplayName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: 'Usuário', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

@Injectable()
export class KeycloakAdminService {
  private tokenCache: { token: string; expiresAt: number } | null = null;

  /** Issuer único do realm `citybox-marketplace` — sem default (ADR C-16, invariante 1). */
  private getIssuer(): string {
    return keycloakIssuer();
  }

  /**
   * Credencial de provisionamento do PRÓPRIO realm (`marketplace-provisioning`).
   * Substitui o antigo service account global `citybox-core-admin`, que tinha
   * `manage-users` no realm compartilhado e podia reescrever usuário de
   * qualquer sistema (defeito D3 do ADR C-16).
   */
  private getClientCredentials(): { clientId: string; clientSecret: string } | null {
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
        'Sync Keycloak indisponível: configure KEYCLOAK_PROVISIONING_CLIENT_ID e KEYCLOAK_PROVISIONING_CLIENT_SECRET',
      );
    }
    if (this.tokenCache && this.tokenCache.expiresAt > Date.now() + 30_000) {
      return this.tokenCache.token;
    }

    const { serverUrl, realm } = parseIssuer(this.getIssuer());
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
    });
    const res = await fetch(`${serverUrl}/realms/${realm}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) {
      throw new ServiceUnavailableException('Falha ao obter token admin do Keycloak');
    }
    const data = (await res.json()) as { access_token: string; expires_in?: number };
    const expiresIn = (data.expires_in ?? 60) * 1000;
    this.tokenCache = { token: data.access_token, expiresAt: Date.now() + expiresIn };
    return data.access_token;
  }

  private adminBase(): string {
    const { serverUrl, realm } = parseIssuer(this.getIssuer());
    return `${serverUrl}/admin/realms/${realm}`;
  }

  async updateProfile(
    keycloakSub: string,
    input: { name?: string; email?: string },
  ): Promise<void> {
    if (!input.name && !input.email) return;
    const token = await this.getAdminToken();
    const getRes = await fetch(`${this.adminBase()}/users/${keycloakSub}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5_000),
    });
    if (!getRes.ok) {
      throw new ServiceUnavailableException('Usuário não encontrado no Keycloak');
    }
    const existing = (await getRes.json()) as Record<string, unknown>;
    const body: Record<string, unknown> = { ...existing };
    if (input.email) {
      body.email = input.email;
      // username é read-only em muitos realms — não alterar
    }
    if (input.name) {
      const { firstName, lastName } = splitDisplayName(input.name);
      body.firstName = firstName;
      body.lastName = lastName;
    }
    const res = await fetch(`${this.adminBase()}/users/${keycloakSub}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new ServiceUnavailableException(
        detail
          ? `Não foi possível atualizar o perfil no Keycloak: ${detail.slice(0, 200)}`
          : 'Não foi possível atualizar o perfil no Keycloak',
      );
    }
  }

  /** Troca senha via Account REST API do Keycloak (JWT do próprio usuário). */
  async changeOwnPassword(
    userAccessToken: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const { serverUrl, realm } = parseIssuer(this.getIssuer());
    const res = await fetch(
      `${serverUrl}/realms/${realm}/account/credentials/password`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${userAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmation: newPassword,
        }),
        signal: AbortSignal.timeout(5_000),
      },
    );
    if (res.ok || res.status === 204) return;
    if (res.status === 400 || res.status === 401) {
      throw new BadRequestException('Senha atual incorreta');
    }
    throw new ServiceUnavailableException('Não foi possível atualizar a senha no Keycloak');
  }
}
