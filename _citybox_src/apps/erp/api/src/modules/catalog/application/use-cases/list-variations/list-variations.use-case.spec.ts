import { ListVariationsUseCase } from './list-variations.use-case';
import { Variation } from '../../../domain/entities/variation.entity';
import { InMemoryVariationRepository } from '../../../tests/in-memory-variation.repository';
import { STORE_ID } from '../../../tests/catalog-test-factory';

function makeVariation(id: string, name: string) {
  return Variation.create(
    {
      organizationId: STORE_ID,
      name,
      calculation: {
        chooseFrom: 1,
        chooseTo: 1,
        chargeFromSelectedQuantity: false,
        chargeFromQuantity: 1,
        priceMethod: 'sum',
      },
      options: [
        {
          id: `${id}-opt`,
          name: 'Opção',
          description: '',
          imageUrl: null,
          priceCents: 0,
          code: '',
          sortOrder: 0,
        },
      ],
    },
    id,
  );
}

describe('ListVariationsUseCase', () => {
  function setup() {
    const variationRepository = new InMemoryVariationRepository();
    const useCase = new ListVariationsUseCase(variationRepository);
    return { variationRepository, useCase };
  }

  it('sem page/perPage devolve lista simples', async () => {
    const { useCase, variationRepository } = setup();
    await variationRepository.save(makeVariation('v1', 'Tamanho'));
    await variationRepository.save(makeVariation('v2', 'Cor'));

    const result = await useCase.execute({ organizationId: STORE_ID });

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
  });

  it('com page/perPage devolve envelope paginado e filtra por search', async () => {
    const { useCase, variationRepository } = setup();
    await variationRepository.save(makeVariation('v1', 'Tamanho'));
    await variationRepository.save(makeVariation('v2', 'Cor'));

    const result = await useCase.execute({
      organizationId: STORE_ID,
      search: 'tam',
      page: 1,
      perPage: 10,
    });

    expect(Array.isArray(result)).toBe(false);
    if (Array.isArray(result)) return;

    expect(result.total).toBe(1);
    expect(result.items[0]?.name).toBe('Tamanho');
    expect(result.page).toBe(1);
    expect(result.perPage).toBe(10);
  });
});
