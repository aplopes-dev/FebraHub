import type {
  IcmsLivreCondition,
  OperationNatureGroupTaxType,
} from '../../domain/entities/operation-nature.entity';

export type OperationNatureCfopRuleDto = {
  fromCfop: string;
  toCfop: string;
  icmsLivre: IcmsLivreCondition;
};

export type OperationNatureGroupRuleDto = {
  taxType: OperationNatureGroupTaxType;
  fromGroupId: string;
  toGroupId: string;
};

export type OperationNatureInputDto = {
  organizationId: string;
  name: string;
  description: string | null;
  cfopRules: OperationNatureCfopRuleDto[];
  groupRules: OperationNatureGroupRuleDto[];
};

export type CreateOperationNatureDto = OperationNatureInputDto;
export type UpdateOperationNatureDto = OperationNatureInputDto & { id: string };

export type GetOperationNatureDto = { organizationId: string; id: string };
export type ListOperationNaturesDto = { organizationId: string };
export type DeleteOperationNatureDto = { organizationId: string; id: string };

/**
 * Resolve a regra de-para de uma natureza (spec erp/020). O emissor informa a
 * operação de entrada (CFOP + se o item é ICMS-livre — derivado do CST/CSOSN do seu
 * grupo, `isIcmsLivre`) e os grupos atuais do item; recebe o CFOP de saída + grupos
 * mapeados. **`null` = nenhuma linha casou → manter o valor original, sem bloquear.**
 */
export type ResolveOperationNatureDto = {
  organizationId: string;
  operationNatureId: string;
  fromCfop: string;
  itemIcmsLivre: boolean;
  itemIcmsGroupId?: string | null;
  itemPisCofinsGroupId?: string | null;
};

export type ResolvedOperationNature = {
  toCfop: string;
  /** Grupo mapeado; se não houver regra de grupo casando, mantém o do item. */
  toIcmsGroupId: string | null;
  toPisCofinsGroupId: string | null;
} | null;
