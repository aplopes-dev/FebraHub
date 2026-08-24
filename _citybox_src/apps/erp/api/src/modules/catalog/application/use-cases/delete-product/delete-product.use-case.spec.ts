import { DeleteProductUseCase } from './delete-product.use-case';
import { RestoreProductUseCase } from '../restore-product/restore-product.use-case';
import { ListProductsUseCase } from '../list-products/list-products.use-case';
import { InMemoryProductRepository } from '../../../tests/in-memory-product.repository';
import { InMemoryStockMovementRepository } from '../../../../stock/tests/in-memory-stock-movement.repository';
import { ProductNotFoundError } from '../../../domain/errors/product-not-found.error';
import {
  makeProduct,
  OTHER_STORE_ID,
  STORE_ID,
} from '../../../tests/catalog-test-factory';

describe('DeleteProductUseCase / RestoreProductUseCase', () => {
  let repository: InMemoryProductRepository;
  let deleteProduct: DeleteProductUseCase;
  let restoreProduct: RestoreProductUseCase;
  let listProducts: ListProductsUseCase;

  beforeEach(async () => {
    repository = new InMemoryProductRepository();
    deleteProduct = new DeleteProductUseCase(repository);
    restoreProduct = new RestoreProductUseCase(repository);
    listProducts = new ListProductsUseCase(
      repository,
      new InMemoryStockMovementRepository(),
    );
    await repository.save(makeProduct({}, 'p1'));
  });

  it('soft-delete tira o produto de "Todos" e coloca em "Excluídos"', async () => {
    await deleteProduct.execute({ organizationId: STORE_ID, id: 'p1' });

    const active = await listProducts.execute({ organizationId: STORE_ID });
    expect(active.products).toHaveLength(0);

    const deleted = await listProducts.execute({
      organizationId: STORE_ID,
      tab: 'deleted',
    });
    expect(deleted.products.map((p) => p.id)).toEqual(['p1']);
  });

  it('soft-delete preserva o registro no repositório', async () => {
    await deleteProduct.execute({ organizationId: STORE_ID, id: 'p1' });

    expect(repository.getAll()).toHaveLength(1);
    expect(repository.getAll()[0]?.isDeleted()).toBe(true);
  });

  it('restore devolve o produto para a aba "Todos"', async () => {
    await deleteProduct.execute({ organizationId: STORE_ID, id: 'p1' });
    await restoreProduct.execute({ organizationId: STORE_ID, id: 'p1' });

    const active = await listProducts.execute({ organizationId: STORE_ID });
    expect(active.products.map((p) => p.id)).toEqual(['p1']);
  });

  it('404 ao excluir produto inexistente', async () => {
    await expect(
      deleteProduct.execute({ organizationId: STORE_ID, id: 'nao-existe' }),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });

  it('404 ao excluir produto de outra loja', async () => {
    await expect(
      deleteProduct.execute({ organizationId: OTHER_STORE_ID, id: 'p1' }),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });

  it('excluir duas vezes é idempotente', async () => {
    await deleteProduct.execute({ organizationId: STORE_ID, id: 'p1' });
    const first = repository.getAll()[0]?.deletedAt;

    await deleteProduct.execute({ organizationId: STORE_ID, id: 'p1' });
    expect(repository.getAll()[0]?.deletedAt).toEqual(first);
  });
});
