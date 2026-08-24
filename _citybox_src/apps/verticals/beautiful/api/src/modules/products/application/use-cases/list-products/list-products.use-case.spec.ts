import { InMemoryProductRepository } from '../../../tests/in-memory-product.repository';
import { ProductEntity } from '../../../domain/entities/product.entity';
import { ListProductsUseCase } from './list-products.use-case';

const STORE_ID = '019c0000-0000-7000-8000-000000000001';

function makeProduct(
  name: string,
  options?: { stock?: number; min?: number; cost?: number },
): ProductEntity {
  return ProductEntity.create({
    storeId: STORE_ID,
    name,
    sku: name.toLowerCase().replace(/\s+/g, '-'),
    unitOfMeasure: 'un',
    stockQuantity: options?.stock ?? 10,
    minStockQuantity: options?.min ?? 2,
    costPrice: options?.cost ?? 1,
    active: true,
  });
}

describe('ListProductsUseCase', () => {
  let repository: InMemoryProductRepository;
  let sut: ListProductsUseCase;

  beforeEach(async () => {
    repository = new InMemoryProductRepository();
    sut = new ListProductsUseCase(repository);

    for (const name of ['Alpha', 'Beta', 'Gamma', 'Delta']) {
      await repository.save(makeProduct(name));
    }
  });

  it('paginates products in the store', async () => {
    const result = await sut.execute({ storeId: STORE_ID, page: 1, perPage: 2 });

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(4);
    expect(result.page).toBe(1);
    expect(result.perPage).toBe(2);
    expect(result.totalPages).toBe(2);
  });

  it('returns the second page', async () => {
    const result = await sut.execute({ storeId: STORE_ID, page: 2, perPage: 3 });

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(4);
    expect(result.totalPages).toBe(2);
  });

  it('computes store-wide stats independent of pagination', async () => {
    await repository.save(
      makeProduct('Zerado', { stock: 0, min: 2, cost: 10 }),
    );
    await repository.save(
      makeProduct('Baixo', { stock: 1, min: 2, cost: 5 }),
    );

    const result = await sut.execute({ storeId: STORE_ID, page: 1, perPage: 2 });

    expect(result.stats.totalProducts).toBe(6);
    expect(result.stats.outOfStock).toBe(1);
    expect(result.stats.lowStock).toBe(1);
    expect(result.stats.inStock).toBe(4);
  });
});
