/** Insumo da ficha técnica, já resolvido para o cálculo de uma ordem. */
export type BomComponent = {
  componentProductId: string;
  name: string;
  unit: string;
  /** Quantidade do insumo por unidade do produto final — Decimal string. */
  quantityPerUnit: string;
  unitCostCents: number;
};

export type ProductionBomEligible = {
  eligible: true;
  productName: string;
  productSku: string;
  components: BomComponent[];
};

export type ProductionBomNotEligible = {
  eligible: false;
  reason: string;
};

export type ProductionBomResult =
  | ProductionBomEligible
  | ProductionBomNotEligible;

/**
 * Porta para ler a ficha técnica (BOM) "ao vivo" de um produto — a ordem de
 * produção nunca copia a receita, sempre lê a `TechnicalSheet` atual.
 */
export abstract class ProductionBomLookup {
  /**
   * `null` → produto inexistente, excluído ou do tipo `supply` (insumo puro,
   * não pode virar ordem de produção). `{ eligible: false }` → produto existe
   * mas não tem ficha técnica, ou a ficha não é `productive_process`.
   */
  abstract findBom(
    organizationId: string,
    productId: string,
  ): Promise<ProductionBomResult | null>;
}
