import { InMemoryBranchRepository } from '../../tenancy/tests/in-memory-branch.repository';
import { ORGANIZATION_ID } from '../../tenancy/tests/tenancy-test-factory';
import {
  Stock,
  type StockLocation,
  type StockProperty,
} from '../domain/entities/stock.entity';
import { InMemoryStockRepository } from './in-memory-stock.repository';
import { InMemoryStockMovementRepository } from './in-memory-stock-movement.repository';

// O validador exige uuid em `organizationId`/`branchIds` — ids inventados
// como "stock-1" reprovam antes de o teste chegar na regra.
export const STOCK_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
export const OTHER_STOCK_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

type StockOverrides = Partial<{
  id: string;
  organizationId: string;
  name: string;
  location: StockLocation;
  property: StockProperty;
  branchIds: string[];
  isDefault: boolean;
  systemKey: string | null;
  isSystem: boolean;
}>;

export function makeStock(overrides: StockOverrides = {}): Stock {
  return Stock.create(
    {
      organizationId: overrides.organizationId ?? ORGANIZATION_ID,
      name: overrides.name ?? 'Depósito Centro',
      location: overrides.location ?? 'deposito',
      property: overrides.property ?? 'proprio',
      branchIds: overrides.branchIds ?? [],
      isDefault: overrides.isDefault ?? false,
      systemKey: overrides.systemKey ?? null,
      isSystem: overrides.isSystem ?? false,
    },
    overrides.id ?? STOCK_ID,
  );
}

/** Repositórios in-memory já ligados — estoques e as unidades da tenancy. */
export function makeRepositories() {
  return {
    stockRepository: new InMemoryStockRepository(),
    branchRepository: new InMemoryBranchRepository(),
    stockMovementRepository: new InMemoryStockMovementRepository(),
  };
}
