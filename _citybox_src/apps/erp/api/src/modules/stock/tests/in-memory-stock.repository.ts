import { Stock } from '../domain/entities/stock.entity';
import {
  StockRepository,
  type StockListCriteria,
} from '../domain/repositories/stock.repository.interface';

export class InMemoryStockRepository extends StockRepository {
  readonly stocks = new Map<string, Stock>();

  findById(organizationId: string, id: string): Promise<Stock | null> {
    const stock = this.stocks.get(id);
    return Promise.resolve(
      stock && stock.organizationId === organizationId ? stock : null,
    );
  }

  findAll(
    organizationId: string,
    criteria: StockListCriteria = {},
  ): Promise<Stock[]> {
    const filtered = this.filter(organizationId, criteria);
    const skip = criteria.skip ?? 0;
    const take = criteria.take ?? filtered.length;
    return Promise.resolve(filtered.slice(skip, skip + take));
  }

  count(
    organizationId: string,
    criteria: { search?: string } = {},
  ): Promise<number> {
    return Promise.resolve(this.filter(organizationId, criteria).length);
  }

  save(stock: Stock): Promise<Stock> {
    // Substitui branchIds junto com o cadastro — espelha o upsert + replace
    // de StockBranch na mesma transação do repositório Prisma.
    this.stocks.set(stock.id, stock);
    return Promise.resolve(stock);
  }

  /** Ids marcados pelo teste como referenciados por compra/inventário/etc. */
  readonly dependentStockIds = new Set<string>();

  hasDependents(organizationId: string, stockId: string): Promise<boolean> {
    const stock = this.stocks.get(stockId);
    if (!stock || stock.organizationId !== organizationId) {
      return Promise.resolve(false);
    }
    return Promise.resolve(this.dependentStockIds.has(stockId));
  }

  delete(organizationId: string, id: string): Promise<void> {
    const stock = this.stocks.get(id);
    if (stock && stock.organizationId === organizationId) {
      this.stocks.delete(id);
    }
    return Promise.resolve();
  }

  private ofOrganization(organizationId: string): Stock[] {
    return [...this.stocks.values()].filter(
      (stock) => stock.organizationId === organizationId,
    );
  }

  private filter(
    organizationId: string,
    criteria: { search?: string },
  ): Stock[] {
    const search = criteria.search?.trim().toLowerCase();

    return this.ofOrganization(organizationId)
      .filter((stock) =>
        search ? stock.name.toLowerCase().includes(search) : true,
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }

  clear(): void {
    this.stocks.clear();
  }
}
