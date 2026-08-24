/**
 * Alçadas do PDV — **uma por organização**.
 *
 * Não há variação por unidade nem por terminal, e é deliberado: limite que
 * muda de caixa para caixa é explorável escolhendo o mais frouxo.
 */
export type PosPolicy = {
  id: string;
  /** Desconto **acima** disto exige supervisor. `100` = nunca exige. */
  discountSupervisorAbovePercent: number;
  /** Sangria **acima** disto exige supervisor. `0` = sempre exige. */
  withdrawalSupervisorAboveCents: number;
  cancellationRequiresSupervisor: boolean;
  refundRequiresSupervisor: boolean;
  updatedAt: string;
};

export type PosPolicyFormValues = {
  discountSupervisorAbovePercent: number;
  withdrawalSupervisorAboveCents: number;
  cancellationRequiresSupervisor: boolean;
  refundRequiresSupervisor: boolean;
};

export function toPosPolicyFormValues(policy: PosPolicy): PosPolicyFormValues {
  return {
    discountSupervisorAbovePercent: policy.discountSupervisorAbovePercent,
    withdrawalSupervisorAboveCents: policy.withdrawalSupervisorAboveCents,
    cancellationRequiresSupervisor: policy.cancellationRequiresSupervisor,
    refundRequiresSupervisor: policy.refundRequiresSupervisor,
  };
}

/**
 * Espelha os defaults da `erp-api`. Serve só para o formulário ter algo antes
 * da primeira resposta — a fonte de verdade continua sendo o servidor, que
 * cria a política na primeira leitura.
 */
export const POS_POLICY_FALLBACK: PosPolicyFormValues = {
  discountSupervisorAbovePercent: 10,
  withdrawalSupervisorAboveCents: 50000,
  cancellationRequiresSupervisor: true,
  refundRequiresSupervisor: true,
};
