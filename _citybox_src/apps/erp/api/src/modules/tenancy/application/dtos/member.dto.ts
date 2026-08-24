import type { MembershipRoleValue } from '../../../../shared/infra/tenancy/tenant-context';
import type { MembershipDetail } from '../../domain/repositories/membership.repository.interface';

export type CreateMemberDto = {
  organizationId: string;
  email: string;
  firstName: string;
  lastName: string;
  /** Perfil de acesso obrigatório — autoriza as permissões finas do membro. */
  permissionProfileId: string;
  role?: MembershipRoleValue;
  /** Filiais que o membro pode operar. Ignorado para OWNER/ADMIN. */
  branchIds?: string[];
  /** Usuário vendedor — default true. */
  isSeller?: boolean;
};

export type CreateMemberResult = {
  detail: MembershipDetail;
  /** Mostrada uma única vez, na resposta da criação. Nunca fica guardada. */
  provisionalPassword: string;
  /** A pessoa já tinha conta no Keycloak e foi apenas vinculada. */
  linkedExistingAccount: boolean;
};

export type ListMembersDto = {
  organizationId: string;
  search?: string;
  activeOnly?: boolean;
  isSeller?: boolean;
  page?: number;
  perPage?: number;
};

export type ListMembersResult = {
  items: MembershipDetail[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type UpdateMemberDto = {
  organizationId: string;
  membershipId: string;
  role?: MembershipRoleValue;
  active?: boolean;
  permissionProfileId?: string;
  branchIds?: string[];
  pdvCode?: string | null;
  isSeller?: boolean;
};

export type RemoveMemberDto = {
  organizationId: string;
  membershipId: string;
};

export type ResetMemberPasswordDto = {
  organizationId: string;
  membershipId: string;
};

export type ResetMemberPasswordResult = {
  email: string | null;
  provisionalPassword: string;
};
