import { UpdateVariationUseCase } from './update-variation.use-case';
import { VariationNotFoundError } from '../../../domain/errors/variation-not-found.error';
import { Variation } from '../../../domain/entities/variation.entity';
import { InMemoryVariationRepository } from '../../../tests/in-memory-variation.repository';
import { STORE_ID } from '../../../tests/catalog-test-factory';

const VARIATION_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

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

describe('UpdateVariationUseCase', () => {
  function setup() {
    const variationRepository = new InMemoryVariationRepository();
    const useCase = new UpdateVariationUseCase(variationRepository);
    return { variationRepository, useCase };
  }

  it('atualiza nome, cálculo e opções', async () => {
    const { useCase, variationRepository } = setup();
    await variationRepository.save(makeVariation());

    const updated = await useCase.execute({
      organizationId: STORE_ID,
      id: VARIATION_ID,
      name: 'Cor',
      calculation: {
        chooseFrom: 1,
        chooseTo: 2,
        chargeFromSelectedQuantity: true,
        chargeFromQuantity: 1,
        priceMethod: 'highest',
      },
      options: [
        { id: 'opt-1', name: 'Azul', priceCents: 200 },
        { name: 'Verde', priceCents: 300 },
      ],
    });

    expect(updated.name).toBe('Cor');
    expect(updated.calculation.chooseTo).toBe(2);
    expect(updated.calculation.priceMethod).toBe('highest');
    expect(updated.options).toHaveLength(2);
    expect(updated.options[0]?.id).toBe('opt-1');
    expect(updated.options[0]?.name).toBe('Azul');
  });

  it('rejeita variação inexistente', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        organizationId: STORE_ID,
        id: VARIATION_ID,
        name: 'Cor',
        calculation: {
          chooseFrom: 1,
          chooseTo: 1,
          chargeFromSelectedQuantity: false,
          chargeFromQuantity: 1,
          priceMethod: 'sum',
        },
        options: [{ name: 'Azul' }],
      }),
    ).rejects.toBeInstanceOf(VariationNotFoundError);
  });
});
