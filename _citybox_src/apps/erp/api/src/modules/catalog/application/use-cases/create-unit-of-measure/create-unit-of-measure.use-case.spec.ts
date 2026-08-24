import { CreateUnitOfMeasureUseCase } from './create-unit-of-measure.use-case';
import { UnitOfMeasureAbbreviationTakenError } from '../../../domain/errors/unit-of-measure-abbreviation-taken.error';
import {
  makeRepositories,
  makeUnit,
  STORE_ID,
} from '../../../tests/catalog-test-factory';

describe('CreateUnitOfMeasureUseCase', () => {
  function setup() {
    const repos = makeRepositories();
    const useCase = new CreateUnitOfMeasureUseCase(repos.unitRepository);
    return { ...repos, useCase };
  }

  it('cria uma unidade com nome, sigla e tipo', async () => {
    const { useCase } = setup();

    const unit = await useCase.execute({
      organizationId: STORE_ID,
      name: ' Quilograma ',
      abbreviation: ' KG ',
      kind: 'weight',
      decimalPlaces: 3,
      active: true,
    });

    expect(unit.name).toBe('Quilograma');
    expect(unit.abbreviation).toBe('KG');
    expect(unit.kind).toBe('weight');
    expect(unit.decimalPlaces).toBe(3);
    expect(unit.active).toBe(true);
  });

  it('rejeita sigla duplicada na mesma organização', async () => {
    const { useCase, unitRepository } = setup();
    await unitRepository.save(makeUnit({ id: 'uom-1' }));

    await expect(
      useCase.execute({
        organizationId: STORE_ID,
        name: 'Outra unidade',
        abbreviation: 'un',
        kind: 'unit',
      }),
    ).rejects.toBeInstanceOf(UnitOfMeasureAbbreviationTakenError);
  });
});
