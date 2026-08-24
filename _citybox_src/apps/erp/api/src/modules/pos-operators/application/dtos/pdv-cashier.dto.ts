/**
 * Sessão / lista de caixa no PDV — identidade = Membership/User.
 * `id` é sempre `userId`.
 */
export type PdvCashierListItem = {
  id: string;
  membershipId: string;
  code: string;
  name: string;
  permissionIds: string[];
};

export type PdvCashierSession = PdvCashierListItem & {
  active: boolean;
  locked: boolean;
  lockedUntil: string | null;
};

export type PdvCashierSyncEntry = PdvCashierListItem & {
  pinHash: string;
};

export type SyncPdvCashiersResult = {
  operators: PdvCashierSyncEntry[];
  syncedAt: Date;
  expiresAt: Date;
};
