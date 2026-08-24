import type { Membership } from '../entities/membership.entity';
import type { User } from '../entities/user.entity';

/** Resumo do perfil de acesso ligado ao membro (quando houver). */
export type MembershipPermissionProfileSummary = {
  id: string;
  name: string;
  systemKey: string | null;
  /** IDs finos do catálogo — usados pelo PDV (elegibilidade / alçada). */
  permissionIds: string[];
};

/** Um membro como as telas precisam dele: vínculo + pessoa + filiais. */
export type MembershipDetail = {
  membership: Membership;
  user: User;
  /** Filiais explícitas. Vazio para OWNER/ADMIN, que acessam todas. */
  branchIds: string[];
  /** Perfil de permissões finas; `null` em linhas legadas sem backfill. */
  permissionProfile: MembershipPermissionProfileSummary | null;
};

export type MembershipListCriteria = {
  search?: string;
  activeOnly?: boolean;
  /** Quando definido, filtra membros com `isSeller` igual ao valor. */
  isSeller?: boolean;
  skip?: number;
  take?: number;
};

export abstract class MembershipRepository {
  abstract findById(
    organizationId: string,
    id: string,
  ): Promise<MembershipDetail | null>;
  abstract findByUser(
    organizationId: string,
    userId: string,
  ): Promise<Membership | null>;
  /** Lookup do login PDV por código curto (único entre credenciais ativas). */
  abstract findByPdvCode(
    organizationId: string,
    code: string,
  ): Promise<MembershipDetail | null>;
  abstract findAll(
    organizationId: string,
    criteria?: MembershipListCriteria,
  ): Promise<MembershipDetail[]>;
  abstract count(
    organizationId: string,
    criteria?: MembershipListCriteria,
  ): Promise<number>;

  /** Quantos responsáveis ativos restam — guarda a invariante do último OWNER. */
  abstract countActiveOwners(organizationId: string): Promise<number>;

  /** OWNER ativo da organização — usado pelo admin M2M (card do responsável). */
  abstract findActiveOwner(
    organizationId: string,
  ): Promise<MembershipDetail | null>;

  abstract save(membership: Membership): Promise<Membership>;
  abstract delete(organizationId: string, id: string): Promise<void>;

  /** Substitui o conjunto de filiais do membro (lista vazia limpa o acesso). */
  abstract replaceBranchAccess(
    organizationId: string,
    membershipId: string,
    branchIds: string[],
  ): Promise<void>;
}
