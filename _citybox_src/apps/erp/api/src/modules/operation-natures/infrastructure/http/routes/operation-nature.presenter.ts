import type { OperationNature } from '../../../domain/entities/operation-nature.entity';

export class OperationNaturePresenter {
  static toHttpDetail(nature: OperationNature) {
    return {
      id: nature.id,
      name: nature.name,
      description: nature.description,
      keepBenefitInUf: nature.keepBenefitInUf,
      cfopRules: nature.cfopRules.map((rule) => ({
        fromCfop: rule.fromCfop,
        toCfop: rule.toCfop,
        icmsLivre: rule.icmsLivre,
      })),
      groupRules: nature.groupRules.map((rule) => ({
        taxType: rule.taxType,
        fromGroupId: rule.fromGroupId,
        toGroupId: rule.toGroupId,
      })),
      updatedAt: nature.updatedAt.toISOString(),
    };
  }

  static toHttpSingle(nature: OperationNature) {
    return { data: OperationNaturePresenter.toHttpDetail(nature) };
  }

  static toHttpList(natures: OperationNature[]) {
    // Na lista, resumo (sem as matrizes de-para inteiras).
    return {
      data: natures.map((nature) => ({
        id: nature.id,
        name: nature.name,
        description: nature.description,
        cfopRuleCount: nature.cfopRules.length,
        updatedAt: nature.updatedAt.toISOString(),
      })),
    };
  }
}
