import type { MembershipDetail } from '../../../../domain/repositories/membership.repository.interface';
import type {
  CreateMemberResult,
  ListMembersResult,
} from '../../../../application/dtos/member.dto';

export class MemberPresenter {
  static toHttp(detail: MembershipDetail) {
    const { membership, user, branchIds, permissionProfile } = detail;
    return {
      id: membership.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      role: membership.role,
      active: membership.active,
      isSeller: membership.isSeller,
      pdvCode: membership.pdvCode,
      hasPdvPin: membership.hasPdvPin,
      pdvLocked: membership.isPdvLocked(),
      pdvLockedUntil: membership.pdvLockedUntil?.toISOString() ?? null,
      pdvPinUpdatedAt: membership.pdvPinUpdatedAt?.toISOString() ?? null,
      permissionProfile: permissionProfile
        ? {
            id: permissionProfile.id,
            name: permissionProfile.name,
            systemKey: permissionProfile.systemKey,
          }
        : null,
      /** Vazio quando o papel dá acesso a tudo — ver `accessesAllBranches`. */
      branchIds,
      accessesAllBranches: membership.hasImplicitAccessToAllBranches,
      createdAt: membership.createdAt.toISOString(),
    };
  }

  static toHttpSingle(detail: MembershipDetail) {
    return { data: this.toHttp(detail) };
  }

  /**
   * A senha provisória vai no `meta`, e não no recurso: ela não é um atributo
   * do membro, é um evento único desta resposta — depois daqui, ninguém mais
   * consegue lê-la.
   */
  static toHttpCreated(result: CreateMemberResult) {
    return {
      data: this.toHttp(result.detail),
      meta: {
        provisionalPassword: result.provisionalPassword,
        linkedExistingAccount: result.linkedExistingAccount,
      },
    };
  }

  static toHttpList(result: ListMembersResult) {
    return {
      data: result.items.map((detail) => this.toHttp(detail)),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }
}
