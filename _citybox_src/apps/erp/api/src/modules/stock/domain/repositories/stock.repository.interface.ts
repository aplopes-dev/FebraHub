import type { Stock } from '../entities/stock.entity';

export type StockListCriteria = {
  search?: string;
  skip?: number;
  take?: number;
};

export abstract class StockRepository {
  abstract findById(organizationId: string, id: string): Promise<Stock | null>;

  abstract findAll(
    organizationId: string,
    criteria?: StockListCriteria,
  ): Promise<Stock[]>;

  abstract count(
    organizationId: string,
    criteria?: { search?: string },
  ): Promise<number>;

  /**
   * Grava o estoque **e** os vínculos com as unidades na mesma operação
   * (substitui `StockBranch` — padrão de `SupplierBranch` / `ProductBranch`).
   */
  abstract save(stock: Stock): Promise<Stock>;

  /**
   * O depósito é referenciado por compra, inventário, transferência ou ordem
   * de produção?
   *
   * Todas essas FKs são `onDelete: Restrict`, e nenhuma delas gera movimento
   * enquanto está pendente — uma compra `pending` no depósito X passava na
   * checagem de `hasMovementsOrBalance` e estourava FK (`P2003`) no delete,
   * escapando como 500.
   */
  abstract hasDependents(
    organizationId: string,
    stockId: string,
  ): Promise<boolean>;

  abstract delete(organizationId: string, id: string): Promise<void>;
}
