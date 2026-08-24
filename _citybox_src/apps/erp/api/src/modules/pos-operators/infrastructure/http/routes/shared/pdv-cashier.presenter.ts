import type {
  PdvCashierListItem,
  PdvCashierSession,
  SyncPdvCashiersResult,
} from '../../../../application/dtos/pdv-cashier.dto';

/** Respostas device do PDV — identidade Membership/User (`id` = userId). */
export class PdvCashierPresenter {
  static toHttpListItem(item: PdvCashierListItem) {
    return {
      id: item.id,
      membershipId: item.membershipId,
      code: item.code,
      name: item.name,
      permissionIds: item.permissionIds,
    };
  }

  static toHttpSession(session: PdvCashierSession) {
    return {
      data: {
        ...this.toHttpListItem(session),
        active: session.active,
        locked: session.locked,
        lockedUntil: session.lockedUntil,
      },
    };
  }

  static toHttpList(items: PdvCashierListItem[]) {
    return { data: items.map((item) => this.toHttpListItem(item)) };
  }

  static toHttpSync(result: SyncPdvCashiersResult) {
    return {
      data: {
        operators: result.operators.map((operator) => ({
          id: operator.id,
          membershipId: operator.membershipId,
          code: operator.code,
          name: operator.name,
          permissionIds: operator.permissionIds,
          pinHash: operator.pinHash,
        })),
        syncedAt: result.syncedAt.toISOString(),
        expiresAt: result.expiresAt.toISOString(),
      },
    };
  }
}
