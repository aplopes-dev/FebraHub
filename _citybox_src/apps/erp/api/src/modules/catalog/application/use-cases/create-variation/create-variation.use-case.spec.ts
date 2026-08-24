import { CreateVariationUseCase } from './create-variation.use-case';
import { VariationInvalidError } from '../../../domain/errors/variation-invalid.error';
import { InMemoryVariationRepository } from '../../../tests/in-memory-variation.repository';
import { STORE_ID } from '../../../tests/catalog-test-factory';

const baseInput = () => ({
  organizationId: STORE_ID,
  name: ' Tamanho ',
  calculation: {
    chooseFrom: 1,
    chooseTo: 1,
    chargeFromSelectedQuantity: false,
    chargeFromQuantity: 1,
    priceMethod: 'sum' as const,
  },
  options: [
    { name: ' P ', priceCents: 0, code: 'P' },
    { name: 'M', priceCents: 100, code: 'M' },
  ],
});

describe('CreateVariationUseCase', () => {
  function setup() {
    const variationRepository = new InMemoryVariationRepository();
    const useCase = new CreateVariationUseCase(variationRepository);
    return { variationRepository, useCase };
  }

  it('cria variação com opções normalizadas', async () => {
    const { useCase } = setup();

    const variation = await useCase.execute(baseInput());

    expect(variation.name).toBe('Tamanho');
    expect(variation.options).toHaveLength(2);
    expect(variation.options[0]?.name).toBe('P');
    expect(variation.options[1]?.priceCents).toBe(100);
    expect(variation.calculation.priceMethod).toBe('sum');
  });

  it('rejeita sem nome', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({ ...baseInput(), name: '   ' }),
    ).rejects.toBeInstanceOf(VariationInvalidError);
  });

  it('rejeita sem opções nomeadas', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        ...baseInput(),
        options: [{ name: '  ' }],
      }),
    ).rejects.toBeInstanceOf(VariationInvalidError);
  });

  it('rejeita chooseTo menor que chooseFrom', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        ...baseInput(),
        calculation: {
          ...baseInput().calculation,
          chooseFrom: 2,
          chooseTo: 1,
        },
      }),
    ).rejects.toBeInstanceOf(VariationInvalidError);
  });
});
