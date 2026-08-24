export type GetPosPolicyDto = { organizationId: string };

/** PATCH-like: campo ausente não muda. Não há "criar" — há sempre uma. */
export type UpsertPosPolicyDto = {
  organizationId: string;
  discountSupervisorAbovePercent?: number;
  withdrawalSupervisorAboveCents?: number;
  cancellationRequiresSupervisor?: boolean;
  refundRequiresSupervisor?: boolean;
};
