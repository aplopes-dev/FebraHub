export type IcmsLivreConditionDto = "AMBOS" | "SIM" | "NAO";
export type OperationNatureGroupTaxTypeDto = "ICMS" | "PIS_COFINS";

export type OperationNatureCfopRuleDto = {
  fromCfop: string;
  toCfop: string;
  icmsLivre: IcmsLivreConditionDto;
};

export type OperationNatureGroupRuleDto = {
  taxType: OperationNatureGroupTaxTypeDto;
  fromGroupId: string;
  toGroupId: string;
};

export type OperationNatureDto = {
  id: string;
  name: string;
  description: string | null;
  keepBenefitInUf: boolean;
  cfopRules: OperationNatureCfopRuleDto[];
  groupRules: OperationNatureGroupRuleDto[];
  updatedAt: string;
};

export type OperationNatureListItemDto = {
  id: string;
  name: string;
  description: string | null;
  cfopRuleCount: number;
  updatedAt: string;
};

export type OperationNatureListResponseDto = { data: OperationNatureListItemDto[] };
export type OperationNatureResponseDto = { data: OperationNatureDto };

export type UpsertOperationNaturePayload = {
  name: string;
  description: string | null;
  cfopRules: OperationNatureCfopRuleDto[];
  groupRules: OperationNatureGroupRuleDto[];
};
