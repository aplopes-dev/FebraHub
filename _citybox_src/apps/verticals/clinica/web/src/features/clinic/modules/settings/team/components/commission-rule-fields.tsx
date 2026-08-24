'use client';

import { AlertTriangle } from 'lucide-react';
import { cn } from '@citybox/ui';
import {
  Alert,
  AlertDescription,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@citybox/ui/atoms';
import { usePatientPlanOptions } from '@/features/clinic/modules/patients/lib/use-patient-plan-options';
import { parseBrlCurrencyToCents } from '@/features/clinic/modules/patients/lib/patient-budget-form-utils';
import { PlanBrlCurrencyInput } from '@/features/clinic/modules/settings/plans/components/plan-brl-currency-input';
import { EMPTY_BRL_CURRENCY } from '@/features/clinic/modules/settings/plans/lib/format-brl-currency';
import {
  COMMISSION_SCOPE_ALL,
  COMMISSION_TYPE_LABELS,
  PAYMENT_TRIGGER_LABELS,
  type CommissionPaymentTrigger,
  type CommissionRule,
  type CommissionType,
} from '../types/commission';
import {
  findExistingBudgetApprovedRule,
  findMatchingCommissionRule,
} from '../lib/commission-rule-identity';
import { isFixedValueSpecialtyMissingTreatments } from '../lib/fixed-value-specialty-readiness';
import { useCommissionPlanSpecialties } from '../lib/use-commission-plan-specialties';

const SCOPE_ALL_LABEL = 'Todos';

const PAYMENT_TRIGGER_OPTIONS: { value: CommissionPaymentTrigger; label: string }[] = [
  { value: 'treatment_completed', label: PAYMENT_TRIGGER_LABELS.treatment_completed },
  { value: 'debit_received', label: PAYMENT_TRIGGER_LABELS.debit_received },
  { value: 'budget_approved', label: PAYMENT_TRIGGER_LABELS.budget_approved },
];

const COMMISSION_TYPE_OPTIONS: { value: CommissionType; label: string }[] = [
  { value: 'percentage', label: COMMISSION_TYPE_LABELS.percentage },
  { value: 'fixed_value', label: COMMISSION_TYPE_LABELS.fixed_value },
];

/** Resumo da regra existente de aprovação de orçamento (ex.: no alerta de duplicidade). */
export function formatBudgetApprovedRuleSummary(rule: CommissionRule): string {
  const typePart =
    rule.commissionType === 'percentage'
      ? `${COMMISSION_TYPE_LABELS.percentage} ${rule.percentageValue ?? 0}%`
      : rule.commissionValueBrl
        ? `${COMMISSION_TYPE_LABELS.fixed_value} ${rule.commissionValueBrl}`
        : COMMISSION_TYPE_LABELS.fixed_value;

  return `${PAYMENT_TRIGGER_LABELS.budget_approved} - Plano Todos > ${typePart}`;
}

type CommissionRuleFieldsProps = {
  rule: CommissionRule;
  disabled?: boolean;
  /** Regras já salvas (para detectar duplicidade de aprovação de orçamento). */
  existingRules?: CommissionRule[];
  onUpdate: (patch: Partial<CommissionRule>) => void;
};

export function CommissionRuleFields({
  rule,
  disabled = false,
  existingRules = [],
  onUpdate,
}: CommissionRuleFieldsProps) {
  const showsPlanAndSpecialty =
    rule.paymentTrigger === 'treatment_completed' ||
    rule.paymentTrigger === 'debit_received';

  const isBudgetApproved = rule.paymentTrigger === 'budget_approved';

  const existingBudgetApprovedRule = findExistingBudgetApprovedRule(
    existingRules,
    rule.id,
  );

  const matchingExistingRule = findMatchingCommissionRule(
    existingRules,
    rule,
    rule.id,
  );

  /** Gatilho orçamento escolhido, tipo ainda não (ou não é %) → aviso longo. */
  const showsBudgetPendingTypeAlert =
    isBudgetApproved &&
    existingBudgetApprovedRule !== undefined &&
    rule.commissionType !== 'percentage';

  /** Tipo = porcentagem → aviso curto “já cadastrada”. */
  const showsBudgetPercentageRegisteredAlert =
    isBudgetApproved &&
    existingBudgetApprovedRule !== undefined &&
    rule.commissionType === 'percentage';

  const showsMatchingRuleAlert =
    !isBudgetApproved && matchingExistingRule !== undefined;

  const allowsScopeAll = rule.commissionType === 'percentage';
  const planIsAll = rule.planId === COMMISSION_SCOPE_ALL;

  const { plans, isLoading: isPlansLoading } = usePatientPlanOptions();
  const { specialties, isLoading: isSpecialtiesLoading } = useCommissionPlanSpecialties(
    planIsAll ? COMMISSION_SCOPE_ALL : rule.planId,
  );

  const selectedSpecialty = specialties.find((s) => s.id === rule.specialtyId) ?? null;

  const showsTreatmentTable =
    rule.commissionType === 'fixed_value' &&
    showsPlanAndSpecialty &&
    !!rule.planId &&
    rule.planId !== COMMISSION_SCOPE_ALL &&
    !!rule.specialtyId &&
    rule.specialtyId !== COMMISSION_SCOPE_ALL &&
    selectedSpecialty !== null;

  const showsSpecialtyWithoutTreatmentsAlert =
    !isSpecialtiesLoading &&
    isFixedValueSpecialtyMissingTreatments(rule, selectedSpecialty);

  const handlePaymentTriggerChange = (value: CommissionPaymentTrigger) => {
    onUpdate({
      paymentTrigger: value,
      ...(value === 'budget_approved'
        ? { planId: '', specialtyId: '', treatmentCommissionValues: {}, allowValueExceedsTreatment: false }
        : {}),
    });
  };

  const handleCommissionTypeChange = (value: CommissionType) => {
    const clearsAllScope =
      value === 'fixed_value' &&
      (rule.planId === COMMISSION_SCOPE_ALL ||
        rule.specialtyId === COMMISSION_SCOPE_ALL);

    onUpdate({
      commissionType: value,
      percentageValue: null,
      commissionValueBrl: '',
      allowValueExceedsTreatment: false,
      treatmentCommissionValues: {},
      ...(clearsAllScope ? { planId: '', specialtyId: '' } : {}),
    });
  };

  const handlePlanChange = (planId: string) => {
    onUpdate({ planId, specialtyId: '', treatmentCommissionValues: {} });
  };

  const handleSpecialtyChange = (specialtyId: string) => {
    onUpdate({ specialtyId, treatmentCommissionValues: {} });
  };

  const handleTreatmentCommissionChange = (
    treatmentId: string,
    value: string,
    treatmentValue: string,
  ) => {
    // Se o toggle não está ativo, bloqueia valores maiores que o valor do tratamento
    if (!rule.allowValueExceedsTreatment) {
      const commissionCents = parseBrlCurrencyToCents(value);
      const treatmentCents = parseBrlCurrencyToCents(treatmentValue);
      if (commissionCents > treatmentCents) return;
    }

    onUpdate({
      treatmentCommissionValues: {
        ...rule.treatmentCommissionValues,
        [treatmentId]: value,
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Linha 1: trigger, tipo, valor */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[200px] flex-1 space-y-1.5">
          <Label htmlFor={`commission-trigger-${rule.id}`}>
            Quando você paga o profissional?
          </Label>
          <Select
            value={rule.paymentTrigger ?? undefined}
            onValueChange={(value) =>
              handlePaymentTriggerChange(value as CommissionPaymentTrigger)
            }
            disabled={disabled}
          >
            <SelectTrigger id={`commission-trigger-${rule.id}`} className="w-full">
              <SelectValue placeholder="Selecionar" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_TRIGGER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[180px] flex-1 space-y-1.5">
          <Label htmlFor={`commission-type-${rule.id}`}>
            Selecione o tipo de comissão
          </Label>
          <Select
            value={rule.commissionType ?? undefined}
            onValueChange={(value) =>
              handleCommissionTypeChange(value as CommissionType)
            }
            disabled={disabled}
          >
            <SelectTrigger id={`commission-type-${rule.id}`} className="w-full">
              <SelectValue placeholder="Selecionar" />
            </SelectTrigger>
            <SelectContent>
              {COMMISSION_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[180px] flex-1 space-y-1.5">
          {rule.commissionType === 'percentage' ? (
            <>
              <Label htmlFor={`commission-percentage-${rule.id}`}>
                {isBudgetApproved ? 'Valor em comissão' : 'Percentual'}
              </Label>
              <div className="relative w-full">
                <Input
                  id={`commission-percentage-${rule.id}`}
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={rule.percentageValue ?? ''}
                  placeholder="0"
                  disabled={disabled}
                  onChange={(event) => {
                    if (event.target.value === '') {
                      onUpdate({ percentageValue: null });
                      return;
                    }
                    const parsed = Number.parseFloat(event.target.value);
                    if (!Number.isNaN(parsed)) {
                      onUpdate({ percentageValue: parsed });
                    }
                  }}
                  className={cn('pr-7', disabled && 'opacity-50')}
                />
                <span
                  className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground"
                  aria-hidden
                >
                  %
                </span>
              </div>
            </>
          ) : rule.commissionType === 'fixed_value' && isBudgetApproved ? (
            <>
              <Label htmlFor={`commission-value-brl-${rule.id}`}>
                Valor em comissão
              </Label>
              <PlanBrlCurrencyInput
                id={`commission-value-brl-${rule.id}`}
                value={rule.commissionValueBrl || EMPTY_BRL_CURRENCY}
                onValueChange={(value) => onUpdate({ commissionValueBrl: value })}
                disabled={disabled}
                aria-label="Valor em comissão"
              />
            </>
          ) : rule.commissionType === 'fixed_value' ? (
            <>
              <Label className="invisible" aria-hidden>
                &nbsp;
              </Label>
              <div className="flex items-center gap-3 pt-1">
                <Switch
                  id={`commission-exceed-${rule.id}`}
                  checked={rule.allowValueExceedsTreatment}
                  disabled={disabled}
                  onCheckedChange={(checked) =>
                    onUpdate({ allowValueExceedsTreatment: checked })
                  }
                />
                <Label
                  htmlFor={`commission-exceed-${rule.id}`}
                  className="text-sm font-normal"
                >
                  Permitir valor da comissão maior que o valor do procedimento
                </Label>
              </div>
            </>
          ) : (
            <>
              <Label htmlFor={`commission-value-pending-${rule.id}`}>
                Valor em comissão
              </Label>
              <Input
                id={`commission-value-pending-${rule.id}`}
                value=""
                placeholder="Selecione o tipo"
                disabled
                readOnly
                aria-label="Valor em comissão"
              />
            </>
          )}
        </div>
      </div>

      {showsBudgetPendingTypeAlert && existingBudgetApprovedRule ? (
        <Alert className="border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-50">
          <AlertTriangle
            className="size-4 text-amber-600 dark:text-amber-400"
            aria-hidden
          />
          <AlertDescription className="text-amber-950 dark:text-amber-50">
            Já existe uma regra de {PAYMENT_TRIGGER_LABELS.budget_approved} (
            {formatBudgetApprovedRuleSummary(existingBudgetApprovedRule)}). Os
            valores foram carregados; ao confirmar, a regra existente será
            atualizada — sem duplicar.
          </AlertDescription>
        </Alert>
      ) : null}

      {showsBudgetPercentageRegisteredAlert && existingBudgetApprovedRule ? (
        <Alert className="border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-50">
          <AlertTriangle
            className="size-4 text-amber-600 dark:text-amber-400"
            aria-hidden
          />
          <AlertDescription className="text-amber-950 dark:text-amber-50">
            <p>Regra já cadastrada para esse profissional.</p>
            <p className="mt-1.5">
              {formatBudgetApprovedRuleSummary(existingBudgetApprovedRule)}
            </p>
          </AlertDescription>
        </Alert>
      ) : null}

      {showsMatchingRuleAlert && matchingExistingRule ? (
        <Alert className="border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-50">
          <AlertTriangle
            className="size-4 text-amber-600 dark:text-amber-400"
            aria-hidden
          />
          <AlertDescription className="text-amber-950 dark:text-amber-50">
            Já existe uma regra com o mesmo gatilho, tipo, plano e especialidade.
            Os valores de comissão foram carregados; ao confirmar, a regra
            existente será atualizada — sem duplicar.
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Linha 2: Plano e Especialidade */}
      {showsPlanAndSpecialty ? (
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px] flex-1 space-y-1.5">
            <Label htmlFor={`commission-plan-${rule.id}`}>Plano</Label>
            <Select
              value={rule.planId || undefined}
              onValueChange={handlePlanChange}
              disabled={
                disabled ||
                isPlansLoading ||
                (!allowsScopeAll && plans.length === 0)
              }
            >
              <SelectTrigger id={`commission-plan-${rule.id}`} className="w-full">
                <SelectValue
                  placeholder={isPlansLoading ? 'Carregando planos…' : 'Selecionar plano'}
                />
              </SelectTrigger>
              <SelectContent>
                {allowsScopeAll ? (
                  <SelectItem value={COMMISSION_SCOPE_ALL}>{SCOPE_ALL_LABEL}</SelectItem>
                ) : null}
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[200px] flex-1 space-y-1.5">
            <Label htmlFor={`commission-specialty-${rule.id}`}>Especialidade</Label>
            <Select
              value={rule.specialtyId || undefined}
              onValueChange={handleSpecialtyChange}
              disabled={
                disabled ||
                !rule.planId ||
                isSpecialtiesLoading ||
                (!allowsScopeAll && specialties.length === 0)
              }
            >
              <SelectTrigger id={`commission-specialty-${rule.id}`} className="w-full">
                <SelectValue
                  placeholder={
                    !rule.planId
                      ? 'Selecione um plano primeiro'
                      : isSpecialtiesLoading
                        ? 'Carregando especialidades…'
                        : specialties.length === 0 && !allowsScopeAll
                          ? 'Nenhuma especialidade disponível'
                          : 'Selecionar especialidade'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {allowsScopeAll ? (
                  <SelectItem value={COMMISSION_SCOPE_ALL}>{SCOPE_ALL_LABEL}</SelectItem>
                ) : null}
                {specialties.map((specialty) => (
                  <SelectItem key={specialty.id} value={specialty.id}>
                    {specialty.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : null}

      {showsSpecialtyWithoutTreatmentsAlert ? (
        <Alert className="border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-50">
          <AlertTriangle
            className="size-4 text-amber-600 dark:text-amber-400"
            aria-hidden
          />
          <AlertDescription className="text-amber-950 dark:text-amber-50">
            Esta especialidade não possui procedimentos cadastrados. Para incluir
            comissão de valor fixo, cadastre ao menos um procedimento em{' '}
            <strong>Configurações → Planos</strong> e volte aqui.
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Tabela de tratamentos */}
      {showsTreatmentTable &&
      selectedSpecialty &&
      !showsSpecialtyWithoutTreatmentsAlert ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            Valor de comissão por procedimento
          </p>
          <div className="min-w-0 overflow-x-auto overscroll-x-contain rounded-lg border border-border/60 [-webkit-overflow-scrolling:touch]">
            <table className="w-full min-w-[28rem] text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Procedimento
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Valor
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Valor comissão
                  </th>
                </tr>
              </thead>
              <tbody>
                {selectedSpecialty.treatments
                  .filter((t) => t.enabled)
                  .map((treatment, idx, arr) => (
                    <tr
                      key={treatment.id}
                      className={cn(idx < arr.length - 1 && 'border-b border-border/40')}
                    >
                      <td className="px-4 py-2.5">
                        <Input
                          value={treatment.name}
                          disabled
                          className="bg-muted/50"
                          aria-label={`Nome do procedimento: ${treatment.name}`}
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <Input
                          value={treatment.treatmentValue}
                          disabled
                          className="bg-muted/50"
                          aria-label={`Valor do procedimento: ${treatment.treatmentValue}`}
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <PlanBrlCurrencyInput
                          value={
                            rule.treatmentCommissionValues[treatment.id] ??
                            EMPTY_BRL_CURRENCY
                          }
                          onValueChange={(value) =>
                            handleTreatmentCommissionChange(treatment.id, value, treatment.treatmentValue)
                          }
                          disabled={disabled}
                          aria-label={`Valor de comissão para ${treatment.name}`}
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
