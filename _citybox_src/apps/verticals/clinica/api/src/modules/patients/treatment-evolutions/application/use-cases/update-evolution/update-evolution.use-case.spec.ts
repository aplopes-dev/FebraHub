import { UpdateTreatmentEvolutionUseCase } from './update-evolution.use-case';
import { InMemoryTreatmentEvolutionRepository } from '../../../tests/in-memory-treatment-evolution.repository';
import { InMemoryPatientRepository } from '../../../../tests/in-memory-patient.repository';
import { seedMinimalPatient } from '../../../../tests/patients-test.fixtures';
import { TreatmentEvolutionConfirmedError } from '../../../domain/errors/treatment-evolution-confirmed.error';

describe('UpdateTreatmentEvolutionUseCase', () => {
  const storeId = 'store-1';
  const patientId = '11111111-1111-4111-8111-111111111111';
  const evolutionId = '22222222-2222-4222-8222-222222222222';

  let patientRepo: InMemoryPatientRepository;
  let evolutionRepo: InMemoryTreatmentEvolutionRepository;
  let useCase: UpdateTreatmentEvolutionUseCase;

  beforeEach(() => {
    patientRepo = new InMemoryPatientRepository();
    evolutionRepo = new InMemoryTreatmentEvolutionRepository();
    useCase = new UpdateTreatmentEvolutionUseCase(patientRepo, evolutionRepo);
    seedMinimalPatient(patientRepo, storeId, patientId);
  });

  it('updates evolution and appends edited history', async () => {
    evolutionRepo.seedEvolution(
      {
        storeId,
        patientId,
        source: 'standalone',
        finalizedAt: new Date('2026-07-01T12:00:00.000Z'),
      },
      evolutionId,
    );

    const updated = await useCase.execute({
      storeId,
      patientId,
      id: evolutionId,
      professionalId: 'prof-2',
      professionalName: 'Dr. Bruno',
      finalizedAt: new Date('2026-07-02T12:00:00.000Z'),
      evolutionNotes: 'Evolução revisada',
    });

    expect(updated.evolutionNotes).toBe('Evolução revisada');
    const history = await evolutionRepo.findHistoryByEvolutionId(
      storeId,
      evolutionId,
    );
    expect(history.some((entry) => entry.action === 'edited')).toBe(true);
  });

  it('rejects update when evolution is confirmed', async () => {
    evolutionRepo.seedEvolution(
      {
        storeId,
        patientId,
        source: 'standalone',
        finalizedAt: new Date('2026-07-01T12:00:00.000Z'),
        confirmedAt: new Date('2026-07-02T12:00:00.000Z'),
        confirmedBy: 'prof-1',
        confirmationHash: 'hash',
      },
      evolutionId,
    );

    await expect(
      useCase.execute({
        storeId,
        patientId,
        id: evolutionId,
        professionalId: 'prof-2',
        professionalName: 'Dr. Bruno',
        finalizedAt: new Date('2026-07-03T12:00:00.000Z'),
        evolutionNotes: 'Tentativa',
      }),
    ).rejects.toBeInstanceOf(TreatmentEvolutionConfirmedError);
  });
});
