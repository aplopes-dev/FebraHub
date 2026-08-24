import {
  IdentityProvider,
  type CreateIdentityInput,
  type IdentityUser,
} from '../domain/providers/identity-provider.interface';

/**
 * Keycloak de mentira: guarda as identidades num Map e registra o que foi
 * pedido, para os testes checarem a compensação (o `deleteUser`) sem
 * inspecionar chamadas de mock.
 */
export class FakeIdentityProvider extends IdentityProvider {
  readonly users = new Map<string, IdentityUser>();
  readonly passwords = new Map<string, string>();
  readonly enabled = new Map<string, boolean>();
  readonly deleted: string[] = [];

  /** Liga a falha na etapa de senha — é o gatilho do rollback da identidade. */
  failOnSetPassword = false;

  private sequence = 0;

  /** Simula uma conta que já existia no Keycloak antes deste fluxo. */
  seedUser(
    username: string,
    email: string | null = null,
    sub = `keycloak-seed-${username}`,
  ): IdentityUser {
    const identity: IdentityUser = {
      sub,
      email: email?.trim().toLowerCase() ?? null,
      username: username.trim().toLowerCase(),
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
    const username = input.username.trim().toLowerCase();
    const email = input.email?.trim().toLowerCase() ?? null;
    // Espelha o Keycloak: username e e-mail são ambos únicos no realm.
    const existing = [...this.users.values()].find(
      (user) =>
        user.username === username || (email !== null && user.email === email),
    );
    if (existing) return Promise.resolve({ sub: existing.sub, created: false });

    this.sequence += 1;
    const sub = `keycloak-sub-${this.sequence}`;
    this.users.set(sub, { sub, email, username });
    return Promise.resolve({ sub, created: true });
  }

  setProvisionalPassword(sub: string, password: string): Promise<void> {
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
    this.deleted.length = 0;
    this.failOnSetPassword = false;
    this.sequence = 0;
  }
}
