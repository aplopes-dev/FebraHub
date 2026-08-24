import { ReplacePriceListItemsUseCase } from './replace-price-list-items.use-case';
import { PriceListNotFoundError } from '../../../domain/errors/price-list-not-found.error';
import { PriceListProductNotFoundError } from '../../../domain/errors/price-list-product-not-found.error';
import { InMemoryPriceListRepository } from '../../../tests/in-memory-price-list.repository';
import {
  makeCategory,
  makeProduct,
  makeRepositories,
  makeUnit,
  STORE_ID,
} from '../../../tests/catalog-test-factory';
import { PriceList } from '../../../domain/entities/price-list.entity';

describe('ReplacePriceListItemsUseCase', () => {
  async function setup() {
    const repos = makeRepositories();
    const priceListRepository = new InMemoryPriceListRepository();
    await repos.categoryRepository.save(makeCategory());
    await repos.unitRepository.save(makeUnit());
    const product = await repos.productRepository.save(
      makeProduct({}, 'prod-1'),
    );
    const list = await priceListRepository.save(
      PriceList.create(
        {
          organizationId: STORE_ID,
          name: 'Padrão',
          adjustmentType: 'manual',
        },
        'pl-1',
      ),
    );
    const useCase = new ReplacePriceListItemsUseCase(
      priceListRepository,
      repos.productRepository,
    );
    return { useCase, priceListRepository, product, list };
  }

  it('substitui o conjunto de itens', async () => {
    const { useCase, product } = await setup();

    const items = await useCase.execute({
      organizationId: STORE_ID,
      priceListId: 'pl-1',
      items: [{ productId: product.id, priceCents: 5990 }],
    });

    expect(items).toHaveLength(1);
    expect(items[0].priceCents).toBe(5990);
  });

  it('rejeita lista inexistente', async () => {
    const { useCase, product } = await setup();

    await expect(
      useCase.execute({
        organizationId: STORE_ID,
        priceListId: 'missing',
        items: [{ productId: product.id, priceCents: 100 }],
      }),
    ).rejects.toBeInstanceOf(PriceListNotFoundError);
  });

  it('rejeita produto inexistente', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        organizationId: STORE_ID,
        priceListId: 'pl-1',
        items: [{ productId: 'no-product', priceCents: 100 }],
      }),
    ).rejects.toBeInstanceOf(PriceListProductNotFoundError);
  });
});
