import { BulkDeleteProductsUseCase } from './bulk-delete-products.use-case';
import { InMemoryProductRepository } from '../../../tests/in-memory-product.repository';
import {
  makeProduct,
  OTHER_STORE_ID,
  STORE_ID,
} from '../../../tests/catalog-test-factory';

describe('BulkDeleteProductsUseCase', () => {
  let repository: InMemoryProductRepository;
  let useCase: BulkDeleteProductsUseCase;

  beforeEach(async () => {
    repository = new InMemoryProductRepository();
    useCase = new BulkDeleteProductsUseCase(repository);
    await repository.save(makeProduct({ sku: 'A-1' }, 'p1'));
    await repository.save(makeProduct({ sku: 'A-2' }, 'p2'));
    await repository.save(
      makeProduct({ sku: 'Z-9', organizationId: OTHER_STORE_ID }, 'p9'),
    );
  });

  it('exclui os ids informados e reporta quantos mudaram', async () => {
    const result = await useCase.execute({
      organizationId: STORE_ID,
      ids: ['p1', 'p2'],
    });

    expect(result.affected).toBe(2);
    expect(repository.getAll().filter((p) => p.isDeleted())).toHaveLength(2);
  });

  it('ignora ids de outra loja', async () => {
    const result = await useCase.execute({
      organizationId: STORE_ID,
      ids: ['p9'],
    });

    expect(result.affected).toBe(0);
    const other = await repository.findById(OTHER_STORE_ID, 'p9');
    expect(other?.isDeleted()).toBe(false);
  });

  it('ignora ids inexistentes', async () => {
    const result = await useCase.execute({
      organizationId: STORE_ID,
      ids: ['p1', 'fantasma'],
    });

    expect(result.affected).toBe(1);
  });

  it('deduplica ids repetidos', async () => {
    const result = await useCase.execute({
      organizationId: STORE_ID,
      ids: ['p1', 'p1', 'p1'],
    });

    expect(result.affected).toBe(1);
  });

  it('lista vazia não faz nada', async () => {
    const result = await useCase.execute({ organizationId: STORE_ID, ids: [] });

    expect(result.affected).toBe(0);
    expect(repository.getAll().every((p) => !p.isDeleted())).toBe(true);
  });
});
