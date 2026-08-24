import type {
  CommissionRuleGroup,
  CommissionSummaryRow,
  CommissionTreatmentRow,
} from '../types/commission-financial.types';

export type ApiListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type ApiCommissionTreatmentRow = {
  id: string;
  paidAt: string;
  patientName: string;
  treatmentName: string;
  paidValueCents: number;
  treatmentCostCents: number;
  installment: string | null;
  commissionCents: number;
};

export type ApiCommissionRuleGroup = {
  id: string;
  triggerLabel: string;
  planName: string;
  specialtyName: string;
  treatmentSummary: string;
  totalCommissionCents: number;
  rows: ApiCommissionTreatmentRow[];
};

export type ApiCommissionSummary = {
  professionalId: string;
  professionalName: string;
  totalCents: number;
  hasCommissionConfigured: boolean;
  paidAt?: string;
  paidValueCents?: number;
  discountCents?: number;
  paymentId?: string;
  ruleGroups: ApiCommissionRuleGroup[];
};

function mapTreatmentRow(api: ApiCommissionTreatmentRow): CommissionTreatmentRow {
  return {
    id: api.id,
    paidAt: api.paidAt,
    patientName: api.patientName,
    treatmentName: api.treatmentName,
    paidValueCents: api.paidValueCents,
    treatmentCostCents: api.treatmentCostCents,
    installment: api.installment,
    commissionCents: api.commissionCents,
  };
}

function mapRuleGroup(api: ApiCommissionRuleGroup): CommissionRuleGroup {
  return {
    id: api.id,
    triggerLabel: api.triggerLabel,
    planName: api.planName,
    specialtyName: api.specialtyName,
    treatmentSummary: api.treatmentSummary,
    totalCommissionCents: api.totalCommissionCents,
    rows: api.rows.map(mapTreatmentRow),
  };
}

export function mapApiCommissionSummaryToUi(
  api: ApiCommissionSummary,
): CommissionSummaryRow {
  return {
    professionalId: api.professionalId,
    professionalName: api.professionalName,
    totalCents: api.totalCents,
    hasCommissionConfigured: api.hasCommissionConfigured,
    paidAt: api.paidAt,
    paidValueCents: api.paidValueCents,
    discountCents: api.discountCents,
    ruleGroups: api.ruleGroups.map(mapRuleGroup),
  };
}
