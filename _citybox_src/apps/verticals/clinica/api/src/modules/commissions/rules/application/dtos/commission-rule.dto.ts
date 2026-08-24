import type {
  CommissionPaymentTrigger,
  CommissionType,
} from '../../../shared/domain/commission-enums';

export type CommissionRuleTreatmentInputDto = {
  treatmentId: string;
  amountCents: number;
  treatmentValueCents: number;
};

export type CommissionRuleInputDto = {
  paymentTrigger: CommissionPaymentTrigger;
  commissionType: CommissionType;
  percentageValue?: number | null;
  commissionValueCents?: number | null;
  allowValueExceedsTreatment?: boolean;
  planId?: string | null;
  specialtyId?: string | null;
  treatments?: CommissionRuleTreatmentInputDto[];
};

export type GetCommissionRulesDto = {
  storeId: string;
  memberId: string;
};

export type ReplaceCommissionRulesDto = {
  storeId: string;
  memberId: string;
  memberName: string;
  rules: CommissionRuleInputDto[];
};
