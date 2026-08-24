import type {
  FiscalGroup,
  FiscalTaxType,
} from '../entities/fiscal-group.entity';

/** Produto que usa o grupo (aba "Produtos", somente-leitura — spec erp/015). */
export type FiscalGroupProductRef = {
  productId: string;
  name: string;
  sku: string;
};

export abstract class FiscalGroupRepository {
  /** Grupos da organização, opcionalmente filtrados por tributo. */
  abstract listByOrganization(
    organizationId: string,
    taxType?: FiscalTaxType,
  ): Promise<FiscalGroup[]>;

  abstract findById(
    organizationId: string,
    id: string,
  ): Promise<FiscalGroup | null>;

  abstract save(group: FiscalGroup): Promise<FiscalGroup>;

  /** Produtos que referenciam o grupo (via `ProductFiscal.pisCofinsGroupId`). */
  abstract listProductsUsingGroup(
    organizationId: string,
    groupId: string,
  ): Promise<FiscalGroupProductRef[]>;

  /**
   * Contagem de produtos por grupo, de um único tributo, num único `groupBy`
   * (spec erp/022, D2) — evita N+1 na listagem unificada de grupos.
   */
  abstract countProductsByGroup(
    organizationId: string,
    taxType: FiscalTaxType,
  ): Promise<Record<string, number>>;

  abstract deleteById(organizationId: string, id: string): Promise<void>;
}
