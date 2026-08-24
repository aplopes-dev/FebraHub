import {
  ProductionBomLookup,
  type BomComponent,
  type ProductionBomResult,
} from '../domain/repositories/production-bom.lookup.interface';

export class InMemoryProductionBomLookup extends ProductionBomLookup {
  private readonly boms = new Map<string, ProductionBomResult>();

  setEligible(
    productId: string,
    data: {
      productName: string;
      productSku: string;
      components: BomComponent[];
    },
  ) {
    this.boms.set(productId, { eligible: true, ...data });
  }

  setNotEligible(productId: string, reason: string) {
    this.boms.set(productId, { eligible: false, reason });
  }

  findBom(
    _organizationId: string,
    productId: string,
  ): Promise<ProductionBomResult | null> {
    return Promise.resolve(this.boms.get(productId) ?? null);
  }

  clear(): void {
    this.boms.clear();
  }
}
