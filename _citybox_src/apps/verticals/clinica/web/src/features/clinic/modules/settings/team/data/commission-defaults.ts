import type { CommissionRule } from '../types/commission';

export function createEmptyCommissionRule(id: string): CommissionRule {
  return {
    id,
    saved: false,
    paymentTrigger: null,
    commissionType: null,
    percentageValue: null,
    commissionValueBrl: '',
    allowValueExceedsTreatment: false,
    planId: '',
    specialtyId: '',
    treatmentCommissionValues: {},
  };
}
