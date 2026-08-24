import { IdentityUserNotFoundError } from '../domain/errors/identity-user-not-found.error';
import {
  IdentityProvider,
  type CreateIdentityInput,
  type IdentityUser,
  type UpdateIdentityProfileInput,
} from '../domain/providers/identity-provider.interface';

/**
 * Keycloak de mentira: guarda as identidades num Map e registra o que foi
 * pedido, para os testes checarem o efeito sem inspecionar chamadas de mock.
 *
 * Substitui o antigo `settings/application/policies/mock-keycloak.ts`, que
 * mockava o `KeycloakProvisioningService` inteiro com `as unknown as`.
 */
export class FakeIdentityProvider extends IdentityProvider {
  readonly users = new Map<string, IdentityUser>();
  readonly passwords = new Map<string, string>();
  readonly enabled = new Map<string, boolean>();
  readonly profiles: Array<{
    sub: string;
    profile: UpdateIdentityProfileInput;
  }> = [];
  readonly deleted: string[] = [];

  /** Liga a falha na etapa de senha — é o gatilho do rollback da identidade. */
  failOnSetPassword = false;

  /** Subs cujo `setProvisionalPassword` deve estourar `IdentityUserNotFoundError`. */
  readonly missingSubs = new Set<string>();

  private sequence = 0;

  /** Simula uma conta que já existia no Keycloak antes deste fluxo. */
  seedUser(email: string, sub = `keycloak-seed-${email}`): IdentityUser {
    const normalized = email.trim().toLowerCase();
    const identity: IdentityUser = {
      sub,
      email: normalized,
      username: normalized,
    };
    this.users.set(sub, identity);
    return identity;
  }

  findByEmail(email: string): Promise<IdentityUser | null> {
    const normalized = email.trim().toLowerCase();
    const found = [...this.users.values()].find(
      (user) => user.email === normalized,
    );
    return Promise.resolve(found ?? null);
  }

  createUser(
    input: CreateIdentityInput,
  ): Promise<{ sub: string; created: boolean }> {
    const email = input.email.trim().toLowerCase();
    const existing = [...this.users.values()].find(
      (user) => user.email === email,
    );
    if (existing) return Promise.resolve({ sub: existing.sub, created: false });

    this.sequence += 1;
    const sub = `keycloak-sub-${this.sequence}`;
    this.users.set(sub, { sub, email, username: email });
    return Promise.resolve({ sub, created: true });
  }

  setProvisionalPassword(sub: string, password: string): Promise<void> {
    if (this.missingSubs.has(sub)) {
      return Promise.reject(new IdentityUserNotFoundError(sub));
    }
    if (this.failOnSetPassword) {
      return Promise.reject(
        new Error('Keycloak indisponível ao definir a senha provisória'),
      );
    }
    this.passwords.set(sub, password);
    return Promise.resolve();
  }

  setEnabled(sub: string, enabled: boolean): Promise<void> {
    this.enabled.set(sub, enabled);
    return Promise.resolve();
  }

  updateProfile(
    sub: string,
    profile: UpdateIdentityProfileInput,
  ): Promise<void> {
    this.profiles.push({ sub, profile });
    return Promise.resolve();
  }

  deleteUser(sub: string): Promise<void> {
    this.deleted.push(sub);
    this.users.delete(sub);
    this.passwords.delete(sub);
    return Promise.resolve();
  }

  clear(): void {
    this.users.clear();
    this.passwords.clear();
    this.enabled.clear();
    this.profiles.length = 0;
    this.deleted.length = 0;
    this.missingSubs.clear();
    this.failOnSetPassword = false;
    this.sequence = 0;
  }
}
