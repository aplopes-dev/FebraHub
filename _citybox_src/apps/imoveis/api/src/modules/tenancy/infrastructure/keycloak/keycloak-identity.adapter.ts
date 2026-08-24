import { Injectable } from '@nestjs/common';
import {
  KeycloakProvisioningError,
  KeycloakProvisioningService,
} from '../../../../shared/infra/keycloak/keycloak-provisioning.service';
import { KeycloakProvisioningFailedError } from '../../../../shared/infra/keycloak/keycloak-provisioning-failed.error';
import { IdentityUserNotFoundError } from '../../domain/errors/identity-user-not-found.error';
import {
  IdentityProvider,
  type CreateIdentityInput,
  type IdentityUser,
  type UpdateIdentityProfileInput,
} from '../../domain/providers/identity-provider.interface';

/**
 * Liga a porta `IdentityProvider` ao Keycloak do realm `citybox-imoveis`.
 *
 * Concentra aqui o que antes vivia em `settings/application/policies/run-keycloak.ts`:
 * a checagem de configuração e a tradução de qualquer falha de infra para
 * `KeycloakProvisioningFailedError` (503). Com a porta no domínio, o wrapper na
 * camada de aplicação deixou de fazer sentido — é o padrão do ERP
 * (`keycloak-unavailable.error.ts` lançado dentro da infra).
 */
@Injectable()
export class KeycloakIdentityAdapter extends IdentityProvider {
  constructor(private readonly keycloak: KeycloakProvisioningService) {
    super();
  }

  async findByEmail(email: string): Promise<IdentityUser | null> {
    return this.run('findByEmail', async () => {
      const user = await this.keycloak.findUserByUsernameOrEmail(
        email.trim().toLowerCase(),
      );
      if (!user) return null;
      return {
        sub: user.id,
        email: user.email ?? null,
        username: user.username ?? null,
      };
    });
  }

  async createUser(
    input: CreateIdentityInput,
  ): Promise<{ sub: string; created: boolean }> {
    const email = input.email.trim().toLowerCase();
    return this.run('createUser', async () => {
      const result = await this.keycloak.provisionMember({
        // O e-mail é o username: o login do Imóveis é por e-mail, e dois campos
        // divergentes só criariam ambiguidade no primeiro acesso.
        username: email,
        email,
        firstName: input.firstName,
        lastName: input.lastName,
      });
      return { sub: result.keycloakSub, created: !result.reused };
    });
  }

  async setProvisionalPassword(sub: string, password: string): Promise<void> {
    await this.run(
      'setProvisionalPassword',
      () =>
        this.keycloak.setProvisionalPassword(sub, password, {
          temporary: true,
        }),
      sub,
    );
  }

  async setEnabled(sub: string, enabled: boolean): Promise<void> {
    await this.run(
      'setEnabled',
      () => this.keycloak.setUserEnabled(sub, enabled),
      sub,
    );
  }

  async updateProfile(
    sub: string,
    profile: UpdateIdentityProfileInput,
  ): Promise<void> {
    await this.run(
      'updateProfile',
      () => this.keycloak.updateProfile(sub, profile),
      sub,
    );
  }

  async deleteUser(sub: string): Promise<void> {
    await this.run('deleteUser', () => this.keycloak.deleteUser(sub), sub);
  }

  /**
   * `notFoundSub` presente ⇒ um 404 do Keycloak vira `IdentityUserNotFoundError`
   * (recuperável) em vez de 503.
   */
  private async run<T>(
    context: string,
    action: () => Promise<T>,
    notFoundSub?: string,
  ): Promise<T> {
    if (!this.keycloak.isConfigured()) {
      throw new KeycloakProvisioningFailedError(
        `${KeycloakIdentityAdapter.name}.${context}`,
        'KEYCLOAK_PROVISIONING_CLIENT_ID / KEYCLOAK_PROVISIONING_CLIENT_SECRET não configurados',
      );
    }

    try {
      return await action();
    } catch (err) {
      if (
        notFoundSub &&
        err instanceof KeycloakProvisioningError &&
        err.status === 404
      ) {
        throw new IdentityUserNotFoundError(notFoundSub);
      }
      throw new KeycloakProvisioningFailedError(
        `${KeycloakIdentityAdapter.name}.${context}`,
        err instanceof Error ? err.message : String(err),
      );
    }
  }
}
