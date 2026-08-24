import { Entity } from '../../../../shared/core/entity';
import {
  PERMISSION_KEYS,
  booleanPermissionsForRole,
  createEmptyBooleanMap,
  type PermissionBooleanMap,
  type PermissionKey,
  type ImovelRoleKey,
} from '@citybox/imoveis-permissions';

/** Papéis da equipe — espelha `UserRole` no web. */
export const TEAM_MEMBER_ROLES = [
  'admin',
  'broker',
  'affiliated',
  'assistant',
] as const;

export type TeamMemberRole = (typeof TEAM_MEMBER_ROLES)[number];

export function isTeamMemberRole(value: string): value is TeamMemberRole {
  return (TEAM_MEMBER_ROLES as readonly string[]).includes(value);
}

export { PERMISSION_KEYS, type PermissionKey };

export type TeamMemberPermissions = PermissionBooleanMap;

export function createPermissions(
  overrides: Partial<TeamMemberPermissions> = {},
): TeamMemberPermissions {
  return { ...createEmptyBooleanMap(), ...overrides };
}

/** Defaults compartilhados com `@citybox/imoveis-permissions`. */
export function permissionsForRole(
  role: TeamMemberRole,
): TeamMemberPermissions {
  return booleanPermissionsForRole(role);
}

/** Iniciais do avatar — mesmo cálculo do `initialsFromName` no web. */
export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export type TeamMemberProps = {
  storeId: string;
  agentId: string;
  name: string;
  email: string;
  phone: string;
  role: TeamMemberRole;
  initials: string;
  active: boolean;
  permissions: TeamMemberPermissions;
  lastAccessAt: Date | null;
  passwordHash: string | null;
  temporaryPassword: string | null;
  mustChangePassword: boolean;
  keycloakSub: string | null;
  username: string | null;
  hasPassword: boolean;
};

export class TeamMemberEntity extends Entity<TeamMemberProps> {
  get storeId(): string {
    return this.props.storeId;
  }
  get agentId(): string {
    return this.props.agentId;
  }
  get name(): string {
    return this.props.name;
  }
  get email(): string {
    return this.props.email;
  }
  get phone(): string {
    return this.props.phone;
  }
  get role(): TeamMemberRole {
    return this.props.role;
  }
  get initials(): string {
    return this.props.initials;
  }
  get active(): boolean {
    return this.props.active;
  }
  get permissions(): TeamMemberPermissions {
    return this.props.permissions;
  }
  get lastAccessAt(): Date | null {
    return this.props.lastAccessAt;
  }
  get passwordHash(): string | null {
    return this.props.passwordHash;
  }
  get temporaryPassword(): string | null {
    return this.props.temporaryPassword;
  }
  get mustChangePassword(): boolean {
    return this.props.mustChangePassword;
  }
  get keycloakSub(): string | null {
    return this.props.keycloakSub;
  }
  get username(): string | null {
    return this.props.username;
  }
  get hasPassword(): boolean {
    return this.props.hasPassword;
  }

  protected validate(): void {
    if (!this.props.storeId) throw new Error('storeId is required');
    if (!this.props.agentId) throw new Error('agentId is required');
  }

  static create(props: TeamMemberProps, id?: string): TeamMemberEntity {
    const entity = new TeamMemberEntity(
      { ...props, permissions: { ...props.permissions } },
      id,
    );
    entity.validate();
    return entity;
  }
}
