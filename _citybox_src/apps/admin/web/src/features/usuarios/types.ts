export type PlatformRole = 'platform_admin' | 'platform_operator';

export interface PlatformUser {
  id: string;
  keycloakSub: string;
  email: string | null;
  displayName: string | null;
  role: PlatformRole;
  createdAt: string;
  updatedAt: string;
}

export type UserFormMode = 'create' | 'edit';

export interface CreateUserPayload {
  email: string;
  firstName: string;
  lastName: string;
  role: PlatformRole;
  sendInvite?: boolean;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: PlatformRole;
}
