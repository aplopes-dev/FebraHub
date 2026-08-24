import { InMemoryPatientRepository } from '../../tests/in-memory-patient.repository';
import {
  CATEGORY_A,
  seedMinimalPatient,
  STORE_A,
} from '../../tests/patients-test.fixtures';
import { AssertPatientExistsService } from '../application/services/assert-patient-exists.service';
import { CreatePatientFinancialEntryUseCase } from '../application/use-cases/create-patient-financial-entry/create-patient-financial-entry.use-case';
import { DeletePatientFinancialEntryUseCase } from '../application/use-cases/delete-patient-financial-entry/delete-patient-financial-entry.use-case';
import { FindPatientFinancialEntryByIdUseCase } from '../application/use-cases/find-patient-financial-entry-by-id/find-patient-financial-entry-by-id.use-case';
import { ListPatientFinancialEntriesUseCase } from '../application/use-cases/list-patient-financial-entries/list-patient-financial-entries.use-case';
import { ReceivePatientFinancialEntryUseCase } from '../application/use-cases/receive-patient-financial-entry/receive-patient-financial-entry.use-case';
import { UpdatePatientFinancialEntryUseCase } from '../application/use-cases/update-patient-financial-entry/update-patient-financial-entry.use-case';
import { GenerateBudgetFinancialEntriesService } from '../application/services/generate-budget-financial-entries.service';
import { HydratePatientFinancialDebitDetailService } from '../application/services/hydrate-patient-financial-debit-detail.service';
import { InMemoryPatientFinancialEntryRepository } from './in-memory-patient-financial-entry.repository';

export const PATIENT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

export { STORE_A };

export type PatientFinancialEntriesTestHarness = {
  patientRepo: InMemoryPatientRepository;
  entryRepo: InMemoryPatientFinancialEntryRepository;
  assertPatientExists: AssertPatientExistsService;
  hydrateDebitDetail: HydratePatientFinancialDebitDetailService;
  listPatientFinancialEntries: ListPatientFinancialEntriesUseCase;
  createPatientFinancialEntry: CreatePatientFinancialEntryUseCase;
  findPatientFinancialEntryById: FindPatientFinancialEntryByIdUseCase;
  updatePatientFinancialEntry: UpdatePatientFinancialEntryUseCase;
  deletePatientFinancialEntry: DeletePatientFinancialEntryUseCase;
  receivePatientFinancialEntry: ReceivePatientFinancialEntryUseCase;
  generateBudgetFinancialEntries: GenerateBudgetFinancialEntriesService;
};

export function createPatientFinancialEntriesTestHarness(): PatientFinancialEntriesTestHarness {
  const patientRepo = new InMemoryPatientRepository();
  const entryRepo = new InMemoryPatientFinancialEntryRepository();
  const assertPatientExists = new AssertPatientExistsService(patientRepo);
  const hydrateDebitDetail = {
    hydrateMany: async (entries: Parameters<HydratePatientFinancialDebitDetailService['hydrateMany']>[0]) =>
      entries,
    hydrateOne: async (entry: Parameters<HydratePatientFinancialDebitDetailService['hydrateOne']>[0]) =>
      entry,
  } as HydratePatientFinancialDebitDetailService;

  return {
    patientRepo,
    entryRepo,
    assertPatientExists,
    hydrateDebitDetail,
    listPatientFinancialEntries: new ListPatientFinancialEntriesUseCase(
      entryRepo,
      assertPatientExists,
      hydrateDebitDetail,
    ),
    createPatientFinancialEntry: new CreatePatientFinancialEntryUseCase(
      entryRepo,
      patientRepo,
      assertPatientExists,
    ),
    findPatientFinancialEntryById: new FindPatientFinancialEntryByIdUseCase(
      entryRepo,
      assertPatientExists,
      hydrateDebitDetail,
    ),
    updatePatientFinancialEntry: new UpdatePatientFinancialEntryUseCase(
      entryRepo,
      assertPatientExists,
      hydrateDebitDetail,
    ),
    deletePatientFinancialEntry: new DeletePatientFinancialEntryUseCase(
      entryRepo,
      assertPatientExists,
    ),
    receivePatientFinancialEntry: new ReceivePatientFinancialEntryUseCase(
      entryRepo,
      assertPatientExists,
      {
        execute: async () => undefined,
      } as never,
    ),
    generateBudgetFinancialEntries: new GenerateBudgetFinancialEntriesService(
      entryRepo,
    ),
  };
}

export function seedPatient(harness: PatientFinancialEntriesTestHarness): void {
  seedMinimalPatient(harness.patientRepo, STORE_A, PATIENT_A, CATEGORY_A);
}
