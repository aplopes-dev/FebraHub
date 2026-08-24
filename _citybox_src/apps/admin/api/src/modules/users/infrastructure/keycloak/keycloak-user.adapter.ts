import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { KeycloakAdminService } from '../../../../shared/infra/keycloak/keycloak-admin.service';
import {
  KeycloakUserProvider,
  type CreateKeycloakUserData,
  type UpdateKeycloakUserData,
} from '../../domain/keycloak/keycloak-user.provider.interface';

const KC_TIMEOUT_MS = 15_000;

@Injectable()
export class KeycloakUserAdapter extends KeycloakUserProvider {
  private readonly logger = new Logger(KeycloakUserAdapter.name);

  constructor(private readonly keycloakAdmin: KeycloakAdminService) {
    super();
  }

  async createUser(
    data: CreateKeycloakUserData,
  ): Promise<{ keycloakSub: string }> {
    const result = await this.keycloakAdmin.findOrInviteUserByEmail(
      data.email,
      {
        firstName: data.firstName,
        lastName: data.lastName,
      },
    );
    return { keycloakSub: result.sub };
  }

  async updateUser(
    keycloakSub: string,
    data: UpdateKeycloakUserData,
  ): Promise<void> {
    const url = `${this.adminBase()}/users/${keycloakSub}`;
    const token = await this.keycloakAdmin['getAdminToken']();

    const body: Record<string, unknown> = {};
    if (data.firstName !== undefined) body.firstName = data.firstName;
    if (data.lastName !== undefined) body.lastName = data.lastName;
    if (data.email !== undefined) {
      body.email = data.email;
      body.emailVerified = false;
    }

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(KC_TIMEOUT_MS),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      this.logger.error(
        `Atualizar usuário Keycloak ${keycloakSub} falhou (${res.status}): ${detail.slice(0, 300)}`,
      );
      throw new ServiceUnavailableException(
        'Falha ao atualizar usuário no Keycloak',
      );
    }
  }

  async deleteUser(keycloakSub: string): Promise<void> {
    const token = await this.keycloakAdmin['getAdminToken']();
    const res = await fetch(`${this.adminBase()}/users/${keycloakSub}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(KC_TIMEOUT_MS),
    });

    if (!res.ok && res.status !== 404) {
      const detail = await res.text().catch(() => '');
      this.logger.error(
        `Deletar usuário Keycloak ${keycloakSub} falhou (${res.status}): ${detail.slice(0, 300)}`,
      );
      throw new ServiceUnavailableException(
        'Falha ao remover usuário no Keycloak',
      );
    }
  }

  async assignRole(keycloakSub: string, role: string): Promise<void> {
    await this.keycloakAdmin.ensureRealmRole(keycloakSub, role);
  }

  async resendInvite(keycloakSub: string): Promise<void> {
    await this.keycloakAdmin.resendUserInvite(keycloakSub);
  }

  private adminBase(): string {
    return this.keycloakAdmin['adminBase']();
  }
}
