import { DeleteVariationUseCase } from './delete-variation.use-case';
import { VariationNotFoundError } from '../../../domain/errors/variation-not-found.error';
import { VariationInUseError } from '../../../domain/errors/variation-in-use.error';
import { Variation } from '../../../domain/entities/variation.entity';
import { InMemoryVariationRepository } from '../../../tests/in-memory-variation.repository';
import { STORE_ID } from '../../../tests/catalog-test-factory';

const VARIATION_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function makeVariation() {
  return Variation.create(
    {
      organizationId: STORE_ID,
      name: 'Tamanho',
      calculation: {
        chooseFrom: 1,
        chooseTo: 1,
        chargeFromSelectedQuantity: false,
        chargeFromQuantity: 1,
        priceMethod: 'sum',
      },
      options: [
        {
          id: 'opt-1',
          name: 'P',
          description: '',
          imageUrl: null,
          priceCents: 0,
          code: 'P',
          sortOrder: 0,
        },
      ],
    },
    VARIATION_ID,
  );
}

describe('DeleteVariationUseCase', () => {
  function setup() {
    const variationRepository = new InMemoryVariationRepository();
    const useCase = new DeleteVariationUseCase(variationRepository);
    return { variationRepository, useCase };
  }

  it('exclui variação sem produtos vinculados', async () => {
    const { useCase, variationRepository } = setup();
    await variationRepository.save(makeVariation());

    await useCase.execute({ organizationId: STORE_ID, id: VARIATION_ID });

    expect(
      await variationRepository.findById(STORE_ID, VARIATION_ID),
    ).toBeNull();
  });

  it('rejeita quando a variação não existe', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({ organizationId: STORE_ID, id: VARIATION_ID }),
    ).rejects.toBeInstanceOf(VariationNotFoundError);
  });

  it('rejeita quando há produtos vinculados', async () => {
    const { useCase, variationRepository } = setup();
    await variationRepository.save(makeVariation());
    variationRepository.setProductLinkCount(VARIATION_ID, 2);

    await expect(
      useCase.execute({ organizationId: STORE_ID, id: VARIATION_ID }),
    ).rejects.toBeInstanceOf(VariationInUseError);
  });
});
