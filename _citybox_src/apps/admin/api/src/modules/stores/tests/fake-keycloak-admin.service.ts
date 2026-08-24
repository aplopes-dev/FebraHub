import type {
  CreateStoreBackofficeUserInput,
  CreateStoreBackofficeUserResult,
  KeycloakUserSummary,
} from '../../../shared/infra/keycloak/keycloak-admin.service';

export class FakeKeycloakAdminService {
  private users = new Map<string, KeycloakUserSummary & { username: string }>();
  private passwords = new Map<string, string>();
  private invites = new Set<string>();
  private provisionalAccessPrepared = new Set<string>();

  async findUserByEmail(email: string): Promise<KeycloakUserSummary | null> {
    const normalized = email.trim().toLowerCase();
    for (const user of this.users.values()) {
      if (user.email?.toLowerCase() === normalized) return user;
    }
    return null;
  }

  async findUserByUsername(
    username: string,
  ): Promise<KeycloakUserSummary | null> {
    const normalized = username.trim().toLowerCase();
    return this.users.get(normalized) ?? null;
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
    if (email) {
      const byEmail = await this.findUserByEmail(email);
      if (byEmail) return { sub: byEmail.sub, created: false };
    }
    const existing = await this.findUserByUsername(username);
    if (existing) {
      const existingEmail = existing.email?.trim().toLowerCase() ?? '';
      if (!email || existingEmail === email) {
        return { sub: existing.sub, created: false };
      }
      throw new Error(
        `Username Keycloak "${username}" já está em uso por outro e-mail`,
      );
    }

    const sub = `kc-${username}`;
    this.users.set(username, {
      sub,
      email: email ?? null,
      displayName: `${input.firstName} ${input.lastName}`.trim(),
      username,
    });
    return { sub, created: true };
  }

  async setProvisionalPassword(
    userId: string,
    password: string,
  ): Promise<void> {
    this.passwords.set(userId, password);
    this.provisionalAccessPrepared.add(userId);
  }

  async setTemporaryPassword(userId: string, password: string): Promise<void> {
    return this.setProvisionalPassword(userId, password);
  }

  async sendInviteEmail(userId: string): Promise<boolean> {
    this.invites.add(userId);
    return true;
  }

  async updateUserProfile(
    userId: string,
    data: { firstName?: string; lastName?: string; email?: string },
  ): Promise<void> {
    for (const user of this.users.values()) {
      if (user.sub === userId) {
        user.displayName = [data.firstName, data.lastName]
          .filter(Boolean)
          .join(' ')
          .trim();
        if (data.email !== undefined) {
          user.email = data.email;
        }
      }
    }
  }

  async resendUserInvite(userId: string): Promise<void> {
    this.invites.add(userId);
  }

  wasPasswordLinkSent(userId: string): boolean {
    return this.invites.has(userId);
  }

  getTemporaryPassword(userId: string): string | undefined {
    return this.passwords.get(userId);
  }

  wasInvited(userId: string): boolean {
    return this.invites.has(userId);
  }

  wasProvisionalAccessPrepared(userId: string): boolean {
    return this.provisionalAccessPrepared.has(userId);
  }

  async setUserEnabled(_userId: string, _enabled: boolean): Promise<void> {
    // no-op for unit tests
  }
}
