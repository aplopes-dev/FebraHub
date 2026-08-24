import { CreateTreatmentEvolutionUseCase } from './create-evolution.use-case';
import { InMemoryTreatmentEvolutionRepository } from '../../../tests/in-memory-treatment-evolution.repository';
import { InMemoryPatientRepository } from '../../../../tests/in-memory-patient.repository';
import { seedMinimalPatient } from '../../../../tests/patients-test.fixtures';
import { STANDALONE_EVOLUTION_DEFAULT_DESCRIPTION } from '../../../domain/entities/treatment-evolution.entity';

describe('CreateTreatmentEvolutionUseCase', () => {
  const storeId = 'store-1';
  const patientId = '11111111-1111-4111-8111-111111111111';

  let patientRepo: InMemoryPatientRepository;
  let evolutionRepo: InMemoryTreatmentEvolutionRepository;
  let useCase: CreateTreatmentEvolutionUseCase;

  beforeEach(() => {
    patientRepo = new InMemoryPatientRepository();
    evolutionRepo = new InMemoryTreatmentEvolutionRepository();
    useCase = new CreateTreatmentEvolutionUseCase(patientRepo, evolutionRepo);
    seedMinimalPatient(patientRepo, storeId, patientId);
  });

  it('creates standalone evolution and appends created history', async () => {
    const finalizedAt = new Date('2026-07-03T12:00:00.000Z');
    const evolution = await useCase.execute({
      storeId,
      patientId,
      professionalId: 'prof-1',
      professionalName: 'Dr. Ana',
      finalizedAt,
      evolutionNotes: 'Paciente estável',
    });

    expect(evolution.source).toBe('standalone');
    expect(evolution.description).toBe(
      STANDALONE_EVOLUTION_DEFAULT_DESCRIPTION,
    );
    expect(evolution.evolutionNotes).toBe('Paciente estável');

    const history = await evolutionRepo.findHistoryByEvolutionId(
      storeId,
      evolution.id,
    );
    expect(history).toHaveLength(1);
    expect(history[0]?.action).toBe('created');
  });
});
