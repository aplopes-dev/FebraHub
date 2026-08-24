import { ContractModel } from '../../../contract-models/domain/entities/contract-model.entity';
import { InMemoryContractModelRepository } from '../../../contract-models/tests/in-memory-contract-model.repository';
import { InMemoryPatientRepository } from '../../tests/in-memory-patient.repository';
import { InMemoryBudgetRepository } from '../../patient-budgets/tests/in-memory-budget.repository';
import { Budget } from '../../patient-budgets/domain/entities/budget.entity';
import {
  CATEGORY_A,
  seedMinimalPatient,
} from '../../tests/patients-test.fixtures';
import { AssertPatientExistsService } from '../application/services/assert-patient-exists.service';
import { CreatePatientContractEmissionUseCase } from '../application/use-cases/create-patient-contract-emission/create-patient-contract-emission.use-case';
import { DeletePatientContractEmissionUseCase } from '../application/use-cases/delete-patient-contract-emission/delete-patient-contract-emission.use-case';
import { ListPatientContractEmissionsUseCase } from '../application/use-cases/list-patient-contract-emissions/list-patient-contract-emissions.use-case';
import { UpdatePatientContractEmissionUseCase } from '../application/use-cases/update-patient-contract-emission/update-patient-contract-emission.use-case';
import { InMemoryPatientContractEmissionRepository } from './in-memory-patient-contract-emission.repository';

export const STORE_A = '11111111-1111-4111-8111-111111111111';
export const PATIENT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const TEMPLATE_A = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
export const CONTRACT_A = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
export const BUDGET_A = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

export type PatientContractEmissionsTestHarness = {
  patientRepo: InMemoryPatientRepository;
  contractModelRepo: InMemoryContractModelRepository;
  emissionRepo: InMemoryPatientContractEmissionRepository;
  budgetRepo: InMemoryBudgetRepository;
  createPatientContractEmission: CreatePatientContractEmissionUseCase;
  updatePatientContractEmission: UpdatePatientContractEmissionUseCase;
  listPatientContractEmissions: ListPatientContractEmissionsUseCase;
  deletePatientContractEmission: DeletePatientContractEmissionUseCase;
};

export function createPatientContractEmissionsTestHarness(): PatientContractEmissionsTestHarness {
  const patientRepo = new InMemoryPatientRepository();
  const contractModelRepo = new InMemoryContractModelRepository();
  const emissionRepo = new InMemoryPatientContractEmissionRepository();
  const budgetRepo = new InMemoryBudgetRepository();
  const assertPatientExists = new AssertPatientExistsService(patientRepo);

  return {
    patientRepo,
    contractModelRepo,
    emissionRepo,
    budgetRepo,
    createPatientContractEmission: new CreatePatientContractEmissionUseCase(
      emissionRepo,
      contractModelRepo,
      patientRepo,
      budgetRepo,
      assertPatientExists,
    ),
    updatePatientContractEmission: new UpdatePatientContractEmissionUseCase(
      emissionRepo,
      contractModelRepo,
      patientRepo,
      assertPatientExists,
    ),
    listPatientContractEmissions: new ListPatientContractEmissionsUseCase(
      emissionRepo,
      assertPatientExists,
    ),
    deletePatientContractEmission: new DeletePatientContractEmissionUseCase(
      emissionRepo,
      assertPatientExists,
    ),
  };
}

export function seedPatient(
  harness: PatientContractEmissionsTestHarness,
  patientId: string = PATIENT_A,
): void {
  seedMinimalPatient(harness.patientRepo, STORE_A, patientId, CATEGORY_A);
}

export async function seedContractTemplate(
  harness: PatientContractEmissionsTestHarness,
  templateId: string = TEMPLATE_A,
): Promise<void> {
  await harness.contractModelRepo.save(
    ContractModel.create(
      {
        storeId: STORE_A,
        name: 'Contrato Padrão',
        content: '<p>{{contractorName}}</p>',
      },
      templateId,
    ),
  );
}

export async function seedApprovedBudget(
  harness: PatientContractEmissionsTestHarness,
  budgetId: string = BUDGET_A,
): Promise<void> {
  await harness.budgetRepo.save({
    budget: Budget.create(
      {
        storeId: STORE_A,
        patientId: PATIENT_A,
        description: 'Orçamento aprovado',
        date: new Date('2026-07-01'),
        responsibleId: 'resp-1',
        responsibleName: 'Dr. João',
        subtotalCents: 100_00,
        finalValueCents: 100_00,
        status: 'approved',
        approvedAt: new Date('2026-07-02'),
      },
      budgetId,
    ),
    items: [],
  });
}

export const SAMPLE_CONTRACT_INPUT = {
  templateId: TEMPLATE_A,
  content: '<p>Maria</p>',
  responsibleName: 'Dr. João',
  contractorName: 'Maria',
  contractorBirthDate: '1990-01-01',
  contractorCpf: '52998224725',
  contractorZip: '45654-000',
  contractorStreet: 'Rua A',
  contractorNeighborhood: 'Centro',
  contractorCity: 'Ilhéus',
  contractorState: 'BA',
  contractedName: 'Clínica',
  contractedDocument: '12345678000199',
  contractedCity: 'Ilhéus',
  contractValue: '1000',
  treatmentsDescription: 'Ortodontia',
  contractDate: '2026-07-06',
};
