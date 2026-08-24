import { randomUUID } from 'crypto';
import {
  KeycloakUserProvider,
  type CreateKeycloakUserData,
  type UpdateKeycloakUserData,
} from '../domain/keycloak/keycloak-user.provider.interface';

export class FakeKeycloakUserProvider extends KeycloakUserProvider {
  public createdUsers: Array<{
    keycloakSub: string;
    data: CreateKeycloakUserData;
  }> = [];
  public updatedUsers: Array<{
    keycloakSub: string;
    data: UpdateKeycloakUserData;
  }> = [];
  public deletedSubs: string[] = [];
  public assignedRoles: Array<{ keycloakSub: string; role: string }> = [];

  async createUser(
    data: CreateKeycloakUserData,
  ): Promise<{ keycloakSub: string }> {
    const keycloakSub = randomUUID();
    this.createdUsers.push({ keycloakSub, data });
    return { keycloakSub };
  }

  async updateUser(
    keycloakSub: string,
    data: UpdateKeycloakUserData,
  ): Promise<void> {
    this.updatedUsers.push({ keycloakSub, data });
  }

  async deleteUser(keycloakSub: string): Promise<void> {
    this.deletedSubs.push(keycloakSub);
  }

  async assignRole(keycloakSub: string, role: string): Promise<void> {
    this.assignedRoles.push({ keycloakSub, role });
  }

  async resendInvite(_keycloakSub: string): Promise<void> {
    // no-op in tests
  }

  clear(): void {
    this.createdUsers = [];
    this.updatedUsers = [];
    this.deletedSubs = [];
    this.assignedRoles = [];
  }
}
