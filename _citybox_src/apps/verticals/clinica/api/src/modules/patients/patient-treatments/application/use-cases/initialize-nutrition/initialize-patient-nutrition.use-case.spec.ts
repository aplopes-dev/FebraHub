import { InitializePatientNutritionUseCase } from './initialize-patient-nutrition.use-case';
import { InMemoryPatientTreatmentRepository } from '../../../tests/in-memory-patient-treatment.repository';
import { InMemoryPatientRepository } from '../../../../tests/in-memory-patient.repository';
import { seedMinimalPatient } from '../../../../tests/patients-test.fixtures';
import { PatientTreatmentNotFoundError } from '../../../domain/errors/patient-treatment-not-found.error';
import { PatientNotFoundError } from '../../../../domain/errors/patient-not-found.error';
import type {
  PatientNutritionInitiationResult,
  PatientNutritionInitiationSummary,
} from '../../../domain/types/patient-nutrition-initiation';
import { filledNutritionSections } from '../../lib/nutrition-init-sections';
import {
  PatientNutritionInitiationStore,
  type SavePatientNutritionInitiationInput,
} from '../../ports/patient-nutrition-initiation.store';

class InMemoryPatientNutritionInitiationStore extends PatientNutritionInitiationStore {
  readonly items: PatientNutritionInitiationResult[] = [];
  readonly anamneses: unknown[] = [];
  readonly evolutions: Array<{ evolutionNotes: string; description: string }> =
    [];

  async save(
    input: SavePatientNutritionInitiationInput,
  ): Promise<PatientNutritionInitiationResult> {
    this.items.push(input.initiation);
    this.evolutions.push({
      evolutionNotes: input.evolution.evolutionNotes,
      description: input.evolution.description,
    });
    if (input.patientAnamnesis) {
      this.anamneses.push(input.patientAnamnesis);
    }
    return input.initiation;
  }

  async findByEvolutionId(
    storeId: string,
    patientId: string,
    evolutionId: string,
  ): Promise<PatientNutritionInitiationResult | null> {
    return (
      this.items.find(
        (item) =>
          item.storeId === storeId &&
          item.patientId === patientId &&
          item.evolutionId === evolutionId,
      ) ?? null
    );
  }

  async findSummariesByPatient(
    storeId: string,
    patientId: string,
  ): Promise<PatientNutritionInitiationSummary[]> {
    return this.items
      .filter(
        (item) => item.storeId === storeId && item.patientId === patientId,
      )
      .map((item) => ({
        id: item.id,
        patientId: item.patientId,
        treatmentId: item.treatmentId,
        evolutionId: item.evolutionId,
        professionalId: item.professionalId,
        professionalName: item.professionalName,
        initiatedAt: item.initiatedAt,
        filledSections: filledNutritionSections(item),
      }));
  }
}

describe('InitializePatientNutritionUseCase', () => {
  const storeId = 'store-1';
  const patientId = '11111111-1111-4111-8111-111111111111';
  const treatmentId = '22222222-2222-4222-8222-222222222222';
  const professionalId = '33333333-3333-4333-8333-333333333333';
  const initiatedAt = new Date('2026-08-14T12:00:00.000Z');

  let patientRepo: InMemoryPatientRepository;
  let treatmentRepo: InMemoryPatientTreatmentRepository;
  let nutritionStore: InMemoryPatientNutritionInitiationStore;
  let snapshotService: {
    execute: jest.Mock;
  };
  let validateService: {
    validateProfessionalCreate: jest.Mock;
  };
  let useCase: InitializePatientNutritionUseCase;

  beforeEach(() => {
    patientRepo = new InMemoryPatientRepository();
    treatmentRepo = new InMemoryPatientTreatmentRepository();
    nutritionStore = new InMemoryPatientNutritionInitiationStore();
    snapshotService = {
      execute: jest.fn(),
    };
    validateService = {
      validateProfessionalCreate: jest.fn(),
    };
    useCase = new InitializePatientNutritionUseCase(
      patientRepo,
      treatmentRepo,
      nutritionStore,
      snapshotService as never,
      validateService as never,
    );
    seedMinimalPatient(patientRepo, storeId, patientId);
    treatmentRepo.seed(
      {
        storeId,
        patientId,
        planId: null,
        treatmentId: null,
        professionalId,
        professionalName: 'Nutri',
        planName: 'Particular',
        treatmentName: 'Acompanhamento Nutricional',
        description: 'Acompanhamento Nutricional',
        valueCents: 0,
        locationType: 'none',
        locationLabel: '',
        diagnosis: '',
        observation: '',
        sortOrder: 0,
        finalizedAt: null,
      },
      treatmentId,
    );
  });

  it('creates nutrition initiation linked to evolution card', async () => {
    const result = await useCase.execute({
      storeId,
      patientId,
      treatmentId,
      professionalId,
      professionalName: 'Nutri',
      initiatedAt,
      anamnesis: {},
      body: { notes: 'IMC 22' },
      treatmentPlan: { notes: 'Plano Y' },
    });

    expect(result.treatmentId).toBe(treatmentId);
    expect(result.evolutionId).toBeTruthy();
    expect(result.anamnesis).toEqual({});
    expect(result.body).toEqual({ notes: 'IMC 22' });
    expect(result.treatmentPlan).toEqual({ notes: 'Plano Y' });
    expect(result.patientAnamnesisId).toBeNull();
    expect(nutritionStore.items).toHaveLength(1);
    expect(nutritionStore.anamneses).toHaveLength(0);
    expect(nutritionStore.evolutions[0]).toEqual({
      description: 'Acompanhamento Nutricional',
      evolutionNotes: 'Acompanhamento Nutricional',
    });
    expect(snapshotService.execute).not.toHaveBeenCalled();
  });

  it('throws when patient is missing', async () => {
    await expect(
      useCase.execute({
        storeId,
        patientId: '99999999-9999-4999-8999-999999999999',
        treatmentId,
        professionalId,
        initiatedAt,
      }),
    ).rejects.toBeInstanceOf(PatientNotFoundError);
  });

  it('throws when treatment is missing', async () => {
    await expect(
      useCase.execute({
        storeId,
        patientId,
        treatmentId: '99999999-9999-4999-8999-999999999999',
        professionalId,
        initiatedAt,
      }),
    ).rejects.toBeInstanceOf(PatientTreatmentNotFoundError);
  });

  it('creates a patient anamnesis when a template is selected', async () => {
    const templateId = '44444444-4444-4444-8444-444444444444';
    const questions = [
      {
        id: 'q-1',
        text: 'Tratamentos anteriores',
        type: 'rich_text' as const,
      },
    ];
    snapshotService.execute.mockResolvedValue({
      templateName: 'Anamnese de acompanhamento nutricional resumida',
      questionsSnapshot: questions,
      formQuestions: questions,
    });
    const answers = [
      { questionId: 'consultation-reason', text: '<p>Queixa</p>' },
      { questionId: 'q-1', text: '<p>Dieta</p>' },
    ];
    validateService.validateProfessionalCreate.mockReturnValue(answers);

    const result = await useCase.execute({
      storeId,
      patientId,
      treatmentId,
      professionalId,
      professionalName: 'Nutri',
      initiatedAt,
      anamnesis: {
        templateId,
        consultationReason: '<p>Queixa</p>',
        answers: [{ questionId: 'q-1', text: '<p>Dieta</p>' }],
      },
      body: { notes: 'IMC 22' },
    });

    expect(result.patientAnamnesisId).toBeTruthy();
    expect(result.anamnesis).toEqual({
      templateId,
      templateName: 'Anamnese de acompanhamento nutricional resumida',
      consultationReason: '<p>Queixa</p>',
      questions,
      answers,
    });
    expect(nutritionStore.anamneses).toHaveLength(1);
  });

  it('rejects an inactive template from the snapshot service', async () => {
    snapshotService.execute.mockRejectedValue(new Error('inactive'));

    await expect(
      useCase.execute({
        storeId,
        patientId,
        treatmentId,
        professionalId,
        initiatedAt,
        anamnesis: { templateId: '44444444-4444-4444-8444-444444444444' },
      }),
    ).rejects.toThrow('inactive');
    expect(nutritionStore.items).toHaveLength(0);
  });
});
