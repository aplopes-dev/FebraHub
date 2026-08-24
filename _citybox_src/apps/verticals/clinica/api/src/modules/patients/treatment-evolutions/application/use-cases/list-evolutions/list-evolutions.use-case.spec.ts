import { ListTreatmentEvolutionsUseCase } from './list-evolutions.use-case';
import { InMemoryTreatmentEvolutionRepository } from '../../../tests/in-memory-treatment-evolution.repository';
import { InMemoryPatientRepository } from '../../../../tests/in-memory-patient.repository';
import { seedMinimalPatient } from '../../../../tests/patients-test.fixtures';

describe('ListTreatmentEvolutionsUseCase', () => {
  const storeId = 'store-1';
  const patientId = '11111111-1111-4111-8111-111111111111';

  it('lists evolutions sorted by finalizedAt desc', async () => {
    const patientRepo = new InMemoryPatientRepository();
    const evolutionRepo = new InMemoryTreatmentEvolutionRepository();
    const useCase = new ListTreatmentEvolutionsUseCase(
      patientRepo,
      evolutionRepo,
    );

    seedMinimalPatient(patientRepo, storeId, patientId);

    const olderId = '22222222-2222-4222-8222-222222222222';
    const newerId = '33333333-3333-4333-8333-333333333333';

    evolutionRepo.seedEvolution(
      {
        storeId,
        patientId,
        source: 'standalone',
        finalizedAt: new Date('2026-07-01T12:00:00.000Z'),
      },
      olderId,
    );
    evolutionRepo.seedEvolution(
      {
        storeId,
        patientId,
        source: 'standalone',
        finalizedAt: new Date('2026-07-03T12:00:00.000Z'),
      },
      newerId,
    );

    const evolutions = await useCase.execute({ storeId, patientId });
    expect(evolutions.map((item) => item.id)).toEqual([newerId, olderId]);
  });
});
