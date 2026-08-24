import { DeleteTreatmentEvolutionUseCase } from './delete-evolution.use-case';
import { InMemoryTreatmentEvolutionRepository } from '../../../tests/in-memory-treatment-evolution.repository';
import { InMemoryPatientRepository } from '../../../../tests/in-memory-patient.repository';
import { seedMinimalPatient } from '../../../../tests/patients-test.fixtures';
import { TreatmentEvolutionConfirmedError } from '../../../domain/errors/treatment-evolution-confirmed.error';

describe('DeleteTreatmentEvolutionUseCase', () => {
  const storeId = 'store-1';
  const patientId = '11111111-1111-4111-8111-111111111111';
  const evolutionId = '22222222-2222-4222-8222-222222222222';

  let patientRepo: InMemoryPatientRepository;
  let evolutionRepo: InMemoryTreatmentEvolutionRepository;
  let useCase: DeleteTreatmentEvolutionUseCase;

  beforeEach(() => {
    patientRepo = new InMemoryPatientRepository();
    evolutionRepo = new InMemoryTreatmentEvolutionRepository();
    useCase = new DeleteTreatmentEvolutionUseCase(patientRepo, evolutionRepo);
    seedMinimalPatient(patientRepo, storeId, patientId);
  });

  it('deletes unconfirmed evolution', async () => {
    evolutionRepo.seedEvolution(
      {
        storeId,
        patientId,
        source: 'standalone',
        finalizedAt: new Date('2026-07-01T12:00:00.000Z'),
      },
      evolutionId,
    );

    await useCase.execute({ storeId, patientId, id: evolutionId });
    expect(
      await evolutionRepo.findById(storeId, patientId, evolutionId),
    ).toBeNull();
  });

  it('rejects delete when evolution is confirmed', async () => {
    evolutionRepo.seedEvolution(
      {
        storeId,
        patientId,
        source: 'standalone',
        finalizedAt: new Date('2026-07-01T12:00:00.000Z'),
        confirmedAt: new Date('2026-07-02T12:00:00.000Z'),
      },
      evolutionId,
    );

    await expect(
      useCase.execute({ storeId, patientId, id: evolutionId }),
    ).rejects.toBeInstanceOf(TreatmentEvolutionConfirmedError);
  });
});
