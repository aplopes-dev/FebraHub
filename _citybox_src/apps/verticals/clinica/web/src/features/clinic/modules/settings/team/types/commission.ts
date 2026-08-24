export type CommissionPaymentTrigger =
  | 'treatment_completed'
  | 'debit_received'
  | 'budget_approved';

export type CommissionType = 'percentage' | 'fixed_value';

/**
 * Sentinel de formulário para “Todos” em Plano/Especialidade.
 * Só usado com `commissionType === 'percentage'`; na API vira `null` (wildcard).
 * Valor fixo exige plano/especialidade concretos — sem esta opção.
 */
export const COMMISSION_SCOPE_ALL = '__all__' as const;

export type CommissionRule = {
  /** Identificador local da regra (gerado no frontend). */
  id: string;
  /** true = regra confirmada (exibida no accordion); false = rascunho inline */
  saved: boolean;
  /** null = ainda não escolhido no formulário de nova regra */
  paymentTrigger: CommissionPaymentTrigger | null;
  /** null = ainda não escolhido no formulário de nova regra */
  commissionType: CommissionType | null;
  /** Valor percentual (ex: 7.5 representa 7,5%). Usado quando commissionType === 'percentage'. null = vazio no formulário. */
  percentageValue: number | null;
  /**
   * Valor único de comissão em BRL (ex: 'R$ 25,00').
   * Usado quando paymentTrigger === 'budget_approved' (percentual ou valor fixo).
   */
  commissionValueBrl: string;
  /** Permite que o valor da comissão supere o valor do tratamento. Usado quando commissionType === 'fixed_value'. */
  allowValueExceedsTreatment: boolean;
  /** ID do plano selecionado. Visível para treatment_completed e debit_received.
   * Em porcentagem, `COMMISSION_SCOPE_ALL` = todos os planos (API `null`). */
  planId: string;
  /** ID da especialidade selecionada. Depende do plano selecionado.
   * Em porcentagem, `COMMISSION_SCOPE_ALL` = todas as especialidades (API `null`). */
  specialtyId: string;
  /**
   * Valores de comissão por tratamento, indexados pelo treatmentId.
   * Usado quando commissionType === 'fixed_value' e plano + especialidade estão selecionados.
   * Formato BRL string (ex: 'R$ 25,00'), compatível com PlanBrlCurrencyInput.
   */
  treatmentCommissionValues: Record<string, string>;
};

/** Labels para exibição no resumo de cada regra no accordion. */
export const PAYMENT_TRIGGER_LABELS: Record<CommissionPaymentTrigger, string> = {
  treatment_completed: 'Procedimento finalizado',
  debit_received: 'Débito recebido do paciente',
  budget_approved: 'Aprovação de orçamento',
};

export const COMMISSION_TYPE_LABELS: Record<CommissionType, string> = {
  percentage: 'Porcentagem',
  fixed_value: 'Valor fixo',
};
