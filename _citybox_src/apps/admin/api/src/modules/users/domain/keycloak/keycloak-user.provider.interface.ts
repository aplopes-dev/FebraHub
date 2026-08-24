export interface CreateKeycloakUserData {
  email: string;
  firstName: string;
  lastName?: string;
  sendInvite: boolean;
}

export interface UpdateKeycloakUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export abstract class KeycloakUserProvider {
  abstract createUser(
    data: CreateKeycloakUserData,
  ): Promise<{ keycloakSub: string }>;
  abstract updateUser(
    keycloakSub: string,
    data: UpdateKeycloakUserData,
  ): Promise<void>;
  abstract deleteUser(keycloakSub: string): Promise<void>;
  abstract assignRole(keycloakSub: string, role: string): Promise<void>;
  abstract resendInvite(keycloakSub: string): Promise<void>;
}
