import { UpdateUnitOfMeasureUseCase } from './update-unit-of-measure.use-case';
import { UnitOfMeasureNotFoundError } from '../../../domain/errors/unit-of-measure-not-found.error';
import { UnitOfMeasureAbbreviationTakenError } from '../../../domain/errors/unit-of-measure-abbreviation-taken.error';
import { UnitOfMeasure } from '../../../domain/entities/unit-of-measure.entity';
import {
  makeRepositories,
  makeUnit,
  STORE_ID,
  UNIT_ID,
} from '../../../tests/catalog-test-factory';

describe('UpdateUnitOfMeasureUseCase', () => {
  function setup() {
    const repos = makeRepositories();
    const useCase = new UpdateUnitOfMeasureUseCase(repos.unitRepository);
    return { ...repos, useCase };
  }

  it('atualiza nome, sigla e status', async () => {
    const { useCase, unitRepository } = setup();
    await unitRepository.save(makeUnit());

    const updated = await useCase.execute({
      organizationId: STORE_ID,
      id: UNIT_ID,
      name: 'Litro',
      abbreviation: 'L',
      kind: 'volume',
      decimalPlaces: 2,
      active: false,
    });

    expect(updated.name).toBe('Litro');
    expect(updated.abbreviation).toBe('L');
    expect(updated.active).toBe(false);
  });

  it('rejeita quando a unidade não existe', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        organizationId: STORE_ID,
        id: 'missing-id',
        name: 'Litro',
        abbreviation: 'L',
        kind: 'volume',
        decimalPlaces: 0,
        active: true,
      }),
    ).rejects.toBeInstanceOf(UnitOfMeasureNotFoundError);
  });

  it('rejeita sigla duplicada de outra unidade', async () => {
    const { useCase, unitRepository } = setup();
    await unitRepository.save(makeUnit());
    await unitRepository.save(
      UnitOfMeasure.create(
        {
          organizationId: STORE_ID,
          name: 'Litro',
          abbreviation: 'L',
          kind: 'volume',
        },
        'uom-2',
      ),
    );

    await expect(
      useCase.execute({
        organizationId: STORE_ID,
        id: UNIT_ID,
        name: 'Unidade',
        abbreviation: 'L',
        kind: 'unit',
        decimalPlaces: 0,
        active: true,
      }),
    ).rejects.toBeInstanceOf(UnitOfMeasureAbbreviationTakenError);
  });
});
