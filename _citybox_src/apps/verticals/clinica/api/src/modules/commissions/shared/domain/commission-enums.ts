export type CommissionPaymentTrigger =
  | 'treatment_completed'
  | 'debit_received'
  | 'budget_approved';

export type CommissionType = 'percentage' | 'fixed_value';

export type CommissionAccrualStatus = 'open' | 'paid';

export const COMMISSION_TRIGGER_LABELS: Record<CommissionPaymentTrigger, string> = {
  treatment_completed: 'Procedimento finalizado',
  debit_received: 'Débito recebido do paciente',
  budget_approved: 'Aprovação de orçamento',
};

export function resolveCommissionTriggerLabel(
  trigger: CommissionPaymentTrigger,
): string {
  return COMMISSION_TRIGGER_LABELS[trigger];
}
