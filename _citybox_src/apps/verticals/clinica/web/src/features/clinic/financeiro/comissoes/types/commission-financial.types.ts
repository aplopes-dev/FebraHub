export type CommissionPeriodFilter =
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'last_30_days'
  | 'custom';

export const COMMISSION_PERIOD_OPTIONS: { value: CommissionPeriodFilter; label: string }[] = [
  { value: 'today', label: 'De hoje' },
  { value: 'this_week', label: 'Dessa semana' },
  { value: 'this_month', label: 'Desse mês' },
  { value: 'last_month', label: 'Do mês passado' },
  { value: 'last_30_days', label: 'Dos últimos 30 dias' },
  { value: 'custom', label: 'Escolher período' },
];

export type CommissionPaymentMethod = 'cash' | 'pix' | 'transfer' | 'check';

export const COMMISSION_PAYMENT_METHOD_OPTIONS: {
  value: CommissionPaymentMethod;
  label: string;
}[] = [
  { value: 'cash', label: 'Dinheiro' },
  { value: 'pix', label: 'Pix' },
  { value: 'transfer', label: 'Transferência' },
  { value: 'check', label: 'Cheque' },
];

/** Uma linha da tabela interna de tratamentos num grupo de regra. */
export type CommissionTreatmentRow = {
  id: string;
  paidAt: string;
  patientName: string;
  treatmentName: string;
  paidValueCents: number;
  treatmentCostCents: number;
  installment: string | null;
  commissionCents: number;
};

/** Agrupamento de comissões por regra (trigger + plano + especialidade). */
export type CommissionRuleGroup = {
  id: string;
  triggerLabel: string;
  planName: string;
  specialtyName: string;
  treatmentSummary: string;
  totalCommissionCents: number;
  rows: CommissionTreatmentRow[];
};

/** Linha da tabela principal (Em aberto / Histórico). */
export type CommissionSummaryRow = {
  professionalId: string;
  professionalName: string;
  /** Total em centavos */
  totalCents: number;
  /**
   * false = membro sem regras de comissão cadastradas em Equipe.
   * Em aberto: exibe "Configurar" e permanece na lista mesmo sem linhas no período.
   */
  hasCommissionConfigured: boolean;
  /** Preenchido somente no histórico */
  paidAt?: string;
  /** Valor efetivamente pago (após desconto) — histórico: soma líquida do período */
  paidValueCents?: number;
  /** Soma de descontos aplicados nos pagamentos do período (histórico) */
  discountCents?: number;
  ruleGroups: CommissionRuleGroup[];
};

/** Valores do formulário de pagamento de comissão. */
export type CommissionPayFormValues = {
  description: string;
  commissionValueCents: number;
  paymentDate: string;
  accountId: string;
  paymentMethod: CommissionPaymentMethod;
  hasDiscount: boolean;
  discountCents: number;
  observation: string;
};
