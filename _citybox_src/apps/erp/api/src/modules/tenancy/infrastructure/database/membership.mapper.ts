import type { MembershipRoleValue } from '../../../../shared/infra/tenancy/tenant-context';
import { Membership } from '../../domain/entities/membership.entity';
import { User } from '../../domain/entities/user.entity';

export type MembershipRow = {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  permissionProfileId: string | null;
  active: boolean;
  isSeller: boolean;
  pdvCode: string | null;
  pdvPinHash: string | null;
  pdvPinUpdatedAt: Date | null;
  pdvFailedAttempts: number;
  pdvLockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UserRow = {
  id: string;
  keycloakSub: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type PermissionProfileSummaryRow = {
  id: string;
  name: string;
  systemKey: string | null;
  permissionIds: string[];
};

/** Compartilhado entre os repositórios de organização e de membros. */
export function toMembershipEntity(row: MembershipRow): Membership {
  return Membership.with(
    {
      organizationId: row.organizationId,
      userId: row.userId,
      role: row.role as MembershipRoleValue,
      permissionProfileId: row.permissionProfileId,
      active: row.active,
      isSeller: row.isSeller,
      pdvCode: row.pdvCode,
      pdvPinHash: row.pdvPinHash,
      pdvPinUpdatedAt: row.pdvPinUpdatedAt,
      pdvFailedAttempts: row.pdvFailedAttempts,
      pdvLockedUntil: row.pdvLockedUntil,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    },
    row.id,
  );
}

export function toUserEntity(row: UserRow): User {
  return User.with(
    {
      keycloakSub: row.keycloakSub,
      email: row.email,
      name: row.name,
      avatarUrl: row.avatarUrl,
      active: row.active,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    },
    row.id,
  );
}
