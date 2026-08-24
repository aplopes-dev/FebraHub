import { FindTemplateByIdUseCase } from '../../../anamnesis/application/use-cases/find-template-by-id/find-template-by-id.use-case';
import { ListQuestionsUseCase } from '../../../anamnesis/application/use-cases/list-questions/list-questions.use-case';
import { InMemoryAnamnesisQuestionRepository } from '../../../anamnesis/tests/in-memory-anamnesis-question.repository';
import { InMemoryAnamnesisTemplateRepository } from '../../../anamnesis/tests/in-memory-anamnesis-template.repository';
import { GLOBAL_QUESTION_1 } from '../../../anamnesis/tests/fixtures';
import { InMemoryPatientRepository } from '../../tests/in-memory-patient.repository';
import {
  CATEGORY_A,
  seedMinimalPatient,
  STORE_A,
} from '../../tests/patients-test.fixtures';
import { AssertPatientExistsService } from '../application/services/assert-patient-exists.service';
import { BuildTemplateQuestionsSnapshotService } from '../application/services/build-template-questions-snapshot.service';
import { ValidatePatientAnamnesisAnswersService } from '../application/services/validate-patient-anamnesis-answers.service';
import { CreatePatientAnamnesisUseCase } from '../application/use-cases/create-patient-anamnesis/create-patient-anamnesis.use-case';
import { DeletePatientAnamnesisUseCase } from '../application/use-cases/delete-patient-anamnesis/delete-patient-anamnesis.use-case';
import { FindPublicAnamnesisByTokenUseCase } from '../application/use-cases/find-public-anamnesis-by-token/find-public-anamnesis-by-token.use-case';
import { ListPatientAnamnesesUseCase } from '../application/use-cases/list-patient-anamneses/list-patient-anamneses.use-case';
import { SubmitPublicAnamnesisUseCase } from '../application/use-cases/submit-public-anamnesis/submit-public-anamnesis.use-case';
import { PatientAnamnesis } from '../domain/entities/patient-anamnesis.entity';
import { InMemoryPatientAnamnesisRepository } from './in-memory-patient-anamnesis.repository';

export const PATIENT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const TEMPLATE_A = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
export const ANAMNESIS_A = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

export type PatientAnamnesesTestHarness = {
  patientRepo: InMemoryPatientRepository;
  anamnesisRepo: InMemoryPatientAnamnesisRepository;
  templateRepo: InMemoryAnamnesisTemplateRepository;
  questionRepo: InMemoryAnamnesisQuestionRepository;
  createPatientAnamnesis: CreatePatientAnamnesisUseCase;
  listPatientAnamneses: ListPatientAnamnesesUseCase;
  deletePatientAnamnesis: DeletePatientAnamnesisUseCase;
  findPublicAnamnesisByToken: FindPublicAnamnesisByTokenUseCase;
  submitPublicAnamnesis: SubmitPublicAnamnesisUseCase;
};

export function createPatientAnamnesesTestHarness(): PatientAnamnesesTestHarness {
  const patientRepo = new InMemoryPatientRepository();
  const anamnesisRepo = new InMemoryPatientAnamnesisRepository();
  const templateRepo = new InMemoryAnamnesisTemplateRepository();
  const questionRepo = new InMemoryAnamnesisQuestionRepository();

  const findTemplateById = new FindTemplateByIdUseCase(templateRepo);
  const listQuestions = new ListQuestionsUseCase(questionRepo);
  const assertPatientExists = new AssertPatientExistsService(patientRepo);
  const buildSnapshot = new BuildTemplateQuestionsSnapshotService(
    findTemplateById,
    listQuestions,
  );
  const validateAnswers = new ValidatePatientAnamnesisAnswersService();

  return {
    patientRepo,
    anamnesisRepo,
    templateRepo,
    questionRepo,
    createPatientAnamnesis: new CreatePatientAnamnesisUseCase(
      anamnesisRepo,
      assertPatientExists,
      buildSnapshot,
      validateAnswers,
    ),
    listPatientAnamneses: new ListPatientAnamnesesUseCase(
      anamnesisRepo,
      assertPatientExists,
    ),
    deletePatientAnamnesis: new DeletePatientAnamnesisUseCase(
      anamnesisRepo,
      assertPatientExists,
    ),
    findPublicAnamnesisByToken: new FindPublicAnamnesisByTokenUseCase(
      anamnesisRepo,
    ),
    submitPublicAnamnesis: new SubmitPublicAnamnesisUseCase(
      anamnesisRepo,
      validateAnswers,
    ),
  };
}

export async function seedActiveTemplate(
  harness: PatientAnamnesesTestHarness,
  templateId: string = TEMPLATE_A,
): Promise<void> {
  harness.questionRepo.seed([GLOBAL_QUESTION_1]);
  await harness.templateRepo.saveAggregate({
    id: templateId,
    storeId: STORE_A,
    name: 'Anamnese Geral',
    status: 'active',
    templateQuestions: [
      { questionId: GLOBAL_QUESTION_1.id, active: true },
      { questionId: 'custom-text-1', active: true },
    ],
    customQuestions: [
      {
        id: 'custom-text-1',
        text: 'Descreva alergias',
        type: 'text',
        scope: 'clinic',
      },
    ],
    createdAt: new Date('2026-07-01'),
    updatedAt: new Date('2026-07-01'),
  });
}

export function seedPatient(
  harness: PatientAnamnesesTestHarness,
  patientId: string = PATIENT_A,
): void {
  seedMinimalPatient(harness.patientRepo, STORE_A, patientId, CATEGORY_A);
  harness.anamnesisRepo.seedPatientName(STORE_A, patientId, 'Maria');
}

export function seedAwaitingAnamnesis(
  harness: PatientAnamnesesTestHarness,
  overrides: Partial<{
    id: string;
    publicToken: string;
    linkExpiresAt: Date;
  }> = {},
): PatientAnamnesis {
  const anamnesis = PatientAnamnesis.create(
    {
      storeId: STORE_A,
      patientId: PATIENT_A,
      templateId: TEMPLATE_A,
      templateName: 'Anamnese Geral',
      issuedAt: new Date('2026-07-01'),
      status: 'awaiting_response',
      fillingMode: 'patient',
      consultationReason: null,
      questionsSnapshot: [
        { id: 'custom-text-1', text: 'Descreva alergias', type: 'text' },
      ],
      answers: null,
      publicToken: overrides.publicToken ?? 'public-token-123',
      linkExpiresAt: overrides.linkExpiresAt ?? new Date('2099-12-31'),
    },
    overrides.id ?? ANAMNESIS_A,
  );

  void harness.anamnesisRepo.save(anamnesis);
  return anamnesis;
}
