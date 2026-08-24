import type { FiscalDefaultTaxes } from '../../../../domain/entities/fiscal-default-taxes.entity';
import type { FiscalGroup } from '../../../../domain/entities/fiscal-group.entity';
import type { FiscalGroupWithProductCount } from '../../../../application/use-cases/list-fiscal-groups/list-fiscal-groups.use-case';

/** Situação tributária resumida por tributo (spec erp/022, D2 — "CST/CSOSN + alíquota"). */
function summaryFor(group: FiscalGroup): {
  taxSituation: string | null;
  rate: number | null;
} {
  switch (group.taxType) {
    case 'ICMS':
      return {
        taxSituation: group.icmsCst ?? group.icmsCsosn,
        // ICMS tem alíquota por UF (matriz), não um número único — sem resumo aqui.
        rate: null,
      };
    case 'IPI':
      return { taxSituation: group.ipiCst, rate: group.ipiRate };
    case 'PIS_COFINS':
      return {
        taxSituation: group.pisCst,
        rate: group.pisAliquota,
      };
    case 'ISSQN':
      return { taxSituation: group.issqnTribType, rate: group.issqnRate };
    default: {
      // Achado do typescript-reviewer: sem este `default`, um `FiscalTaxType`
      // novo faria o switch devolver `undefined` em silêncio, vazando
      // `{taxSituation: undefined, rate: undefined}` pro JSON da listagem.
      // `never` força erro de compilação assim que o union crescer.
      const exhaustive: never = group.taxType;
      throw new Error(`Tributo sem resumo de listagem: ${String(exhaustive)}`);
    }
  }
}

export class FiscalGroupPresenter {
  static toHttpDetail(group: FiscalGroup) {
    return {
      id: group.id,
      taxType: group.taxType,
      name: group.name,
    };
  }

  static toHttpList(groups: FiscalGroup[]) {
    return {
      data: groups.map((group) => FiscalGroupPresenter.toHttpDetail(group)),
    };
  }

  /**
   * Listagem unificada de Grupos fiscais (spec erp/022, D1/D2): nome +
   * situação tributária + alíquota + nº de produtos vinculados por grupo.
   */
  static toHttpRichList(groups: FiscalGroupWithProductCount[]) {
    return {
      data: groups.map(({ group, productCount }) => ({
        id: group.id,
        taxType: group.taxType,
        name: group.name,
        ...summaryFor(group),
        productCount,
        updatedAt: group.updatedAt.toISOString(),
      })),
    };
  }
}

export class PisCofinsGroupPresenter {
  static toHttpDetail(group: FiscalGroup) {
    return {
      id: group.id,
      name: group.name,
      pisCst: group.pisCst,
      pisAliquota: group.pisAliquota,
      cofinsCst: group.cofinsCst,
      cofinsAliquota: group.cofinsAliquota,
      updatedAt: group.updatedAt.toISOString(),
    };
  }

  static toHttpSingle(group: FiscalGroup) {
    return { data: PisCofinsGroupPresenter.toHttpDetail(group) };
  }

  static toHttpList(groups: FiscalGroup[]) {
    return {
      data: groups.map((group) => PisCofinsGroupPresenter.toHttpDetail(group)),
    };
  }

  static toHttpProducts(
    products: { productId: string; name: string; sku: string }[],
  ) {
    return { data: products };
  }
}

export class IcmsGroupPresenter {
  static toHttpDetail(group: FiscalGroup) {
    return {
      id: group.id,
      name: group.name,
      icmsCst: group.icmsCst,
      icmsCsosn: group.icmsCsosn,
      ufRates: group.ufRates.map((rate) => ({
        uf: rate.uf,
        rateType: rate.rateType,
        aliquota: rate.aliquota,
      })),
      updatedAt: group.updatedAt.toISOString(),
    };
  }

  static toHttpSingle(group: FiscalGroup) {
    return { data: IcmsGroupPresenter.toHttpDetail(group) };
  }

  static toHttpList(groups: FiscalGroup[]) {
    // Na lista não devolvemos a matriz inteira de UF (só o resumo).
    return {
      data: groups.map((group) => ({
        id: group.id,
        name: group.name,
        icmsCst: group.icmsCst,
        icmsCsosn: group.icmsCsosn,
        updatedAt: group.updatedAt.toISOString(),
      })),
    };
  }

  static toHttpProducts(
    products: { productId: string; name: string; sku: string }[],
  ) {
    return { data: products };
  }
}

export class IssqnGroupPresenter {
  static toHttpDetail(group: FiscalGroup) {
    return {
      id: group.id,
      name: group.name,
      issqnServiceCode: group.issqnServiceCode,
      issqnNationalCode: group.issqnNationalCode,
      issqnRate: group.issqnRate,
      issqnTribType: group.issqnTribType,
      updatedAt: group.updatedAt.toISOString(),
    };
  }

  static toHttpSingle(group: FiscalGroup) {
    return { data: IssqnGroupPresenter.toHttpDetail(group) };
  }

  static toHttpList(groups: FiscalGroup[]) {
    return {
      data: groups.map((group) => IssqnGroupPresenter.toHttpDetail(group)),
    };
  }

  static toHttpProducts(
    products: { productId: string; name: string; sku: string }[],
  ) {
    return { data: products };
  }
}

export class IpiGroupPresenter {
  static toHttpDetail(group: FiscalGroup) {
    return {
      id: group.id,
      name: group.name,
      ipiCst: group.ipiCst,
      ipiEnquadramento: group.ipiEnquadramento,
      ipiRate: group.ipiRate,
      updatedAt: group.updatedAt.toISOString(),
    };
  }

  static toHttpSingle(group: FiscalGroup) {
    return { data: IpiGroupPresenter.toHttpDetail(group) };
  }

  static toHttpList(groups: FiscalGroup[]) {
    return {
      data: groups.map((group) => IpiGroupPresenter.toHttpDetail(group)),
    };
  }

  static toHttpProducts(
    products: { productId: string; name: string; sku: string }[],
  ) {
    return { data: products };
  }
}

export class FiscalDefaultTaxesPresenter {
  static toHttpDetail(defaults: FiscalDefaultTaxes) {
    return {
      id: defaults.id,
      icmsGroupId: defaults.icmsGroupId,
      ipiGroupId: defaults.ipiGroupId,
      pisCofinsGroupId: defaults.pisCofinsGroupId,
      issqnGroupId: defaults.issqnGroupId,
      cfop: defaults.cfop,
      updatedAt: defaults.updatedAt.toISOString(),
    };
  }

  static toHttpSingle(defaults: FiscalDefaultTaxes) {
    return { data: FiscalDefaultTaxesPresenter.toHttpDetail(defaults) };
  }
}
