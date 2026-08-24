import { DeleteUnitOfMeasureUseCase } from './delete-unit-of-measure.use-case';
import { UnitOfMeasureNotFoundError } from '../../../domain/errors/unit-of-measure-not-found.error';
import { UnitOfMeasureInUseError } from '../../../domain/errors/unit-of-measure-in-use.error';
import { UnitOfMeasureNotRemovableError } from '../../../domain/errors/unit-of-measure-not-removable.error';
import {
  makeProduct,
  makeRepositories,
  makeUnit,
  STORE_ID,
  UNIT_ID,
} from '../../../tests/catalog-test-factory';

describe('DeleteUnitOfMeasureUseCase', () => {
  function setup() {
    const repos = makeRepositories();
    const useCase = new DeleteUnitOfMeasureUseCase(
      repos.unitRepository,
      repos.productRepository,
    );
    return { ...repos, useCase };
  }

  it('exclui unidade sem produtos vinculados', async () => {
    const { useCase, unitRepository } = setup();
    await unitRepository.save(makeUnit());

    await useCase.execute({ organizationId: STORE_ID, id: UNIT_ID });

    expect(await unitRepository.findById(STORE_ID, UNIT_ID)).toBeNull();
  });

  it('rejeita exclusão de unidade provisionada pelo sistema', async () => {
    const { useCase, unitRepository } = setup();
    await unitRepository.save(
      makeUnit({ systemKey: 'uom-un', isSystem: true }),
    );

    await expect(
      useCase.execute({ organizationId: STORE_ID, id: UNIT_ID }),
    ).rejects.toBeInstanceOf(UnitOfMeasureNotRemovableError);

    expect(await unitRepository.findById(STORE_ID, UNIT_ID)).not.toBeNull();
  });

  it('rejeita quando a unidade não existe', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({ organizationId: STORE_ID, id: UNIT_ID }),
    ).rejects.toBeInstanceOf(UnitOfMeasureNotFoundError);
  });

  it('rejeita quando há produtos vinculados', async () => {
    const { useCase, unitRepository, productRepository } = setup();
    await unitRepository.save(makeUnit());
    await productRepository.save(makeProduct());

    await expect(
      useCase.execute({ organizationId: STORE_ID, id: UNIT_ID }),
    ).rejects.toBeInstanceOf(UnitOfMeasureInUseError);
  });
});
