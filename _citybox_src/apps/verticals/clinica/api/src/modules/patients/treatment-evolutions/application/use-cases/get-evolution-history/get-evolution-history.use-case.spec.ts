import { GetEvolutionHistoryUseCase } from './get-evolution-history.use-case';
import { InMemoryTreatmentEvolutionRepository } from '../../../tests/in-memory-treatment-evolution.repository';
import { InMemoryPatientRepository } from '../../../../tests/in-memory-patient.repository';
import { seedMinimalPatient } from '../../../../tests/patients-test.fixtures';
import { TreatmentEvolutionNotFoundError } from '../../../domain/errors/treatment-evolution-not-found.error';

describe('GetEvolutionHistoryUseCase', () => {
  const storeId = 'store-1';
  const patientId = '11111111-1111-4111-8111-111111111111';
  const evolutionId = '22222222-2222-4222-8222-222222222222';

  let patientRepo: InMemoryPatientRepository;
  let evolutionRepo: InMemoryTreatmentEvolutionRepository;
  let useCase: GetEvolutionHistoryUseCase;

  beforeEach(() => {
    patientRepo = new InMemoryPatientRepository();
    evolutionRepo = new InMemoryTreatmentEvolutionRepository();
    useCase = new GetEvolutionHistoryUseCase(patientRepo, evolutionRepo);
    seedMinimalPatient(patientRepo, storeId, patientId);
  });

  it('returns history entries sorted by occurredAt desc', async () => {
    evolutionRepo.seedEvolution(
      {
        storeId,
        patientId,
        source: 'standalone',
        finalizedAt: new Date('2026-07-01T12:00:00.000Z'),
      },
      evolutionId,
    );

    evolutionRepo.seedHistory({
      storeId,
      evolutionId,
      action: 'created',
      occurredAt: new Date('2026-07-01T10:00:00.000Z'),
    });
    evolutionRepo.seedHistory({
      storeId,
      evolutionId,
      action: 'edited',
      occurredAt: new Date('2026-07-02T10:00:00.000Z'),
    });

    const history = await useCase.execute({
      storeId,
      patientId,
      id: evolutionId,
    });
    expect(history.map((entry) => entry.action)).toEqual(['edited', 'created']);
  });

  it('rejects unknown evolution', async () => {
    await expect(
      useCase.execute({
        storeId,
        patientId,
        id: '99999999-9999-4999-8999-999999999999',
      }),
    ).rejects.toBeInstanceOf(TreatmentEvolutionNotFoundError);
  });
});
