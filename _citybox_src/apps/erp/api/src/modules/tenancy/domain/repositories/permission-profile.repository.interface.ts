import type { PermissionProfile } from '../entities/permission-profile.entity';

export type PermissionProfileListCriteria = {
  search?: string;
  /** Quando `true`, só perfis com `deletedAt = null`. */
  activeOnly?: boolean;
  page: number;
  perPage: number;
};

export type PermissionProfileListFilters = Omit<
  PermissionProfileListCriteria,
  'page' | 'perPage'
>;

export abstract class PermissionProfileRepository {
  abstract findById(
    organizationId: string,
    id: string,
  ): Promise<PermissionProfile | null>;

  abstract findBySystemKey(
    organizationId: string,
    systemKey: string,
  ): Promise<PermissionProfile | null>;

  abstract findAll(
    organizationId: string,
    criteria: PermissionProfileListCriteria,
  ): Promise<PermissionProfile[]>;

  abstract count(
    organizationId: string,
    filters: PermissionProfileListFilters,
  ): Promise<number>;

  /** Quantos membros usam o perfil — bloqueia exclusão se > 0. */
  abstract countMembershipsUsing(
    organizationId: string,
    profileId: string,
  ): Promise<number>;

  abstract save(profile: PermissionProfile): Promise<PermissionProfile>;

  abstract softDelete(
    organizationId: string,
    id: string,
    deletedAt: Date,
  ): Promise<void>;
}
