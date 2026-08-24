/** Sessão mock do usuário logado (substituída por Keycloak no futuro). */

export type OrganizationType = 'SINGLE_AGENT' | 'AGENCY';

export type UserRole = 'ADMIN' | 'MANAGER' | 'AGENT' | 'AUTONOMOUS';

export type SessionOrganization = {
  id: string;
  name: string;
  type: OrganizationType;
};

export type SessionUser = {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: UserRole;
  organization: SessionOrganization;
};

export type SessionState = {
  user: SessionUser;
};

export const USER_ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  AGENT: 'Corretor',
  AUTONOMOUS: 'Corretor autônomo',
};

export const ORGANIZATION_TYPE_LABEL: Record<OrganizationType, string> = {
  SINGLE_AGENT: 'Corretor autônomo',
  AGENCY: 'Imobiliária',
};
