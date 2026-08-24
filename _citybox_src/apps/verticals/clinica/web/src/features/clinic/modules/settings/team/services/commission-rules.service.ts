import { clinicaFetch } from '@/features/clinic/shared/api/clinica-client';
import {
  formatBrlCurrencyFromCents,
  EMPTY_BRL_CURRENCY,
} from '@/features/clinic/modules/settings/plans/lib/format-brl-currency';
import { parseBrlCurrencyToCents } from '@/features/clinic/modules/patients/lib/patient-budget-form-utils';
import {
  COMMISSION_SCOPE_ALL,
  type CommissionPaymentTrigger,
  type CommissionRule,
  type CommissionType,
} from '../types/commission';
import { dedupeCommissionRulesByIdentity } from '../lib/commission-rule-identity';

/** API `null` (wildcard) → sentinel “Todos” só em regras percentuais. */
function scopeFromApi(
  value: string | null,
  commissionType: CommissionType,
): string {
  if (value) return value;
  return commissionType === 'percentage' ? COMMISSION_SCOPE_ALL : '';
}

/** Sentinel “Todos” / vazio → `null` na API (match em qualquer plano/especialidade). */
function scopeToApi(value: string): string | null {
  if (!value || value === COMMISSION_SCOPE_ALL) return null;
  return value;
}

export type ApiCommissionRuleTreatment = {
  treatmentId: string;
  amountCents: number;
  treatmentValueCents: number;
};

export type ApiCommissionRule = {
  id: string;
  memberId: string;
  memberName: string;
  paymentTrigger: CommissionPaymentTrigger;
  commissionType: CommissionType;
  percentageValue: number | null;
  commissionValueCents: number | null;
  allowValueExceedsTreatment: boolean;
  planId: string | null;
  specialtyId: string | null;
  treatments: ApiCommissionRuleTreatment[];
  createdAt: string;
  updatedAt: string;
};

export type ApiCommissionRuleInput = {
  paymentTrigger: CommissionPaymentTrigger;
  commissionType: CommissionType;
  percentageValue?: number | null;
  commissionValueCents?: number | null;
  allowValueExceedsTreatment?: boolean;
  planId?: string | null;
  specialtyId?: string | null;
  treatments?: ApiCommissionRuleTreatment[];
};

type RulesEnvelope = { data: ApiCommissionRule[] };

export function mapApiCommissionRuleToForm(api: ApiCommissionRule): CommissionRule {
  const treatmentCommissionValues: Record<string, string> = {};
  for (const treatment of api.treatments) {
    treatmentCommissionValues[treatment.treatmentId] = formatBrlCurrencyFromCents(
      treatment.amountCents,
    );
  }

  return {
    id: api.id,
    saved: true,
    paymentTrigger: api.paymentTrigger,
    commissionType: api.commissionType,
    percentageValue: api.percentageValue,
    commissionValueBrl:
      api.commissionValueCents != null
        ? formatBrlCurrencyFromCents(api.commissionValueCents)
        : EMPTY_BRL_CURRENCY,
    allowValueExceedsTreatment: api.allowValueExceedsTreatment,
    planId: scopeFromApi(api.planId, api.commissionType),
    specialtyId: scopeFromApi(api.specialtyId, api.commissionType),
    treatmentCommissionValues,
  };
}

/** Converte regras salvas do formulário para o body do PUT. */
export function mapFormCommissionRulesToApi(
  rules: CommissionRule[],
): ApiCommissionRuleInput[] {
  return dedupeCommissionRulesByIdentity(rules)
    .filter(
      (rule): rule is CommissionRule & {
        paymentTrigger: CommissionPaymentTrigger;
        commissionType: CommissionType;
      } =>
        rule.saved &&
        rule.paymentTrigger !== null &&
        rule.commissionType !== null,
    )
    .map((rule) => {
      const isBudget = rule.paymentTrigger === 'budget_approved';
      const treatments = Object.entries(rule.treatmentCommissionValues).map(
        ([treatmentId, brl]) => {
          const amountCents = parseBrlCurrencyToCents(brl);
          return {
            treatmentId,
            amountCents,
            // Valor de catálogo não é persistido no form; usa o próprio amount
            // (a UI já validou o teto ao digitar).
            treatmentValueCents: Math.max(amountCents, 0),
          };
        },
      );

      return {
        paymentTrigger: rule.paymentTrigger,
        commissionType: rule.commissionType,
        percentageValue:
          rule.commissionType === 'percentage' ? (rule.percentageValue ?? 0) : null,
        commissionValueCents:
          isBudget && rule.commissionType === 'fixed_value'
            ? parseBrlCurrencyToCents(rule.commissionValueBrl)
            : null,
        allowValueExceedsTreatment: rule.allowValueExceedsTreatment,
        planId: isBudget ? null : scopeToApi(rule.planId),
        specialtyId: isBudget ? null : scopeToApi(rule.specialtyId),
        treatments: isBudget || rule.commissionType === 'percentage' ? [] : treatments,
      };
    });
}

export async function getCommissionRules(
  storeId: string,
  memberId: string,
): Promise<CommissionRule[]> {
  const res = await clinicaFetch<RulesEnvelope>(
    storeId,
    `/v1/team/${memberId}/commission-rules`,
  );
  return dedupeCommissionRulesByIdentity(res.data.map(mapApiCommissionRuleToForm));
}

export async function saveCommissionRules(
  storeId: string,
  memberId: string,
  memberName: string,
  rules: CommissionRule[],
): Promise<CommissionRule[]> {
  const res = await clinicaFetch<RulesEnvelope>(
    storeId,
    `/v1/team/${memberId}/commission-rules`,
    {
      method: 'PUT',
      body: JSON.stringify({
        memberName,
        rules: mapFormCommissionRulesToApi(rules),
      }),
    },
  );
  return res.data.map(mapApiCommissionRuleToForm);
}
