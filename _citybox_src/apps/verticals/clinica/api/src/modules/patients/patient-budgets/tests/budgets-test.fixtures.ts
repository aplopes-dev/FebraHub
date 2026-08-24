import { Patient } from '../../domain/entities/patient.entity';
import { CreateBudgetUseCase } from '../application/use-cases/create-budget/create-budget.use-case';
import { UpdateBudgetUseCase } from '../application/use-cases/update-budget/update-budget.use-case';
import { ListBudgetsUseCase } from '../application/use-cases/list-budgets/list-budgets.use-case';
import { FindBudgetByIdUseCase } from '../application/use-cases/find-budget-by-id/find-budget-by-id.use-case';
import { DeleteBudgetUseCase } from '../application/use-cases/delete-budget/delete-budget.use-case';
import { UpdateBudgetStatusUseCase } from '../application/use-cases/update-budget-status/update-budget-status.use-case';
import { AssertPatientExistsService } from '../application/services/assert-patient-exists.service';
import { ValidateBudgetItemReferencesService } from '../application/services/validate-budget-item-references.service';
import { MaterializeBudgetTreatmentsService } from '../application/services/materialize-budget-treatments.service';
import { SyncBudgetSalesOpportunityService } from '../application/services/sync-budget-sales-opportunity.service';
import { GenerateBudgetFinancialEntriesService } from '../../patient-financial-entries/application/services/generate-budget-financial-entries.service';
import type { AccrueCommissionsOnBudgetApprovedService } from '../../../commissions/accruals/application/services/accrue-commissions-on-budget-approved.service';
import { InMemoryPatientFinancialEntryRepository } from '../../patient-financial-entries/tests/in-memory-patient-financial-entry.repository';
import { ClinicPlan } from '../../../clinic-plans/domain/entities/clinic-plan.entity';
import { ClinicPlanSpecialty } from '../../../clinic-plans/domain/entities/clinic-plan-specialty.entity';
import { ClinicPlanTreatment } from '../../../clinic-plans/domain/entities/clinic-plan-treatment.entity';
import {
  CATEGORY_A,
  PLAN_A,
  STORE_A,
  createPatientsTestHarness,
} from '../../tests/patients-test.fixtures';

export { STORE_A, PLAN_A };
import { InMemoryBudgetRepository } from './in-memory-budget.repository';
import { InMemoryPatientTreatmentRepository } from '../../patient-treatments/tests/in-memory-patient-treatment.repository';
import type { BudgetUpsertPayload } from '../application/dtos/budget.dto';
import { EnsureDefaultSalesFunnelsUseCase } from '../../../sales/funnels/application/use-cases/ensure-default-sales-funnels/ensure-default-sales-funnels.use-case';
import { InMemorySalesFunnelRepository } from '../../../sales/funnels/tests/in-memory-sales-funnel.repository';
import { CreateSalesOpportunityUseCase } from '../../../sales/opportunities/application/use-cases/create-sales-opportunity/create-sales-opportunity.use-case';
import { MoveSalesOpportunityUseCase } from '../../../sales/opportunities/application/use-cases/move-sales-opportunity/move-sales-opportunity.use-case';
import { InMemorySalesOpportunityRepository } from '../../../sales/opportunities/tests/in-memory-sales-opportunity.repository';
import { InMemorySalesLabelRepository } from '../../../sales/labels/tests/in-memory-sales-label.repository';

export const PATIENT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const TREATMENT_A = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
export const SPECIALTY_A = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

export type BudgetsTestHarness = ReturnType<typeof createBudgetsTestHarness>;

export function createBudgetsTestHarness() {
  const patientsHarness = createPatientsTestHarness();
  const budgetRepo = new InMemoryBudgetRepository();
  const treatmentRepo = new InMemoryPatientTreatmentRepository();
  const assertPatientExists = new AssertPatientExistsService(
    patientsHarness.patientRepo,
  );
  const validateItemReferences = new ValidateBudgetItemReferencesService(
    patientsHarness.planRepo,
  );
  const materializeBudgetTreatments = new MaterializeBudgetTreatmentsService(
    treatmentRepo,
  );

  const funnelRepo = new InMemorySalesFunnelRepository();
  const opportunityRepo = new InMemorySalesOpportunityRepository();
  const labelRepo = new InMemorySalesLabelRepository();
  const ensureDefaults = new EnsureDefaultSalesFunnelsUseCase(funnelRepo);
  const createOpportunity = new CreateSalesOpportunityUseCase(
    opportunityRepo,
    funnelRepo,
    labelRepo,
  );
  const moveOpportunity = new MoveSalesOpportunityUseCase(
    opportunityRepo,
    funnelRepo,
  );
  const syncSalesOpportunity = new SyncBudgetSalesOpportunityService(
    patientsHarness.patientRepo,
    funnelRepo,
    ensureDefaults,
    createOpportunity,
    opportunityRepo,
  );

  const plan = ClinicPlan.with(
    {
      storeId: STORE_A,
      name: 'Plano Ouro',
      sortOrder: 1,
      status: 'active',
      isDefault: true,
      treatmentInit: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    PLAN_A,
  );
  const specialty = ClinicPlanSpecialty.create(
    {
      storeId: STORE_A,
      planId: PLAN_A,
      name: 'Geral',
      sortOrder: 1,
    },
    SPECIALTY_A,
  );
  const treatment = ClinicPlanTreatment.create(
    {
      storeId: STORE_A,
      planId: PLAN_A,
      specialtyId: SPECIALTY_A,
      name: 'Consulta',
      valueCents: 5000,
      costCents: 1000,
      enabled: true,
      sortOrder: 1,
    },
    TREATMENT_A,
  );
  patientsHarness.planRepo.saveAggregate({
    plan,
    specialties: [specialty],
    treatments: [treatment],
  });

  const patient = Patient.create(
    {
      storeId: STORE_A,
      name: 'Paciente Budget',
      gender: 'female',
      categoryId: CATEGORY_A,
      phone: '73999990000',
    },
    PATIENT_A,
  );
  patientsHarness.patientRepo.seedPatient(patient);

  const createBudget = new CreateBudgetUseCase(
    budgetRepo,
    assertPatientExists,
    validateItemReferences,
    syncSalesOpportunity,
  );
  const updateBudget = new UpdateBudgetUseCase(
    budgetRepo,
    assertPatientExists,
    validateItemReferences,
  );
  const listBudgets = new ListBudgetsUseCase(budgetRepo, assertPatientExists);
  const findBudgetById = new FindBudgetByIdUseCase(
    budgetRepo,
    assertPatientExists,
  );
  const deleteBudget = new DeleteBudgetUseCase(
    budgetRepo,
    assertPatientExists,
    syncSalesOpportunity,
  );
  const financialEntryRepo = new InMemoryPatientFinancialEntryRepository();
  const generateBudgetFinancialEntries =
    new GenerateBudgetFinancialEntriesService(financialEntryRepo);
  const accrueCommissionsOnBudgetApproved = {
    execute: async () => undefined,
  } as unknown as AccrueCommissionsOnBudgetApprovedService;
  const updateBudgetStatus = new UpdateBudgetStatusUseCase(
    budgetRepo,
    assertPatientExists,
    materializeBudgetTreatments,
    generateBudgetFinancialEntries,
    accrueCommissionsOnBudgetApproved,
    syncSalesOpportunity,
  );

  return {
    ...patientsHarness,
    budgetRepo,
    treatmentRepo,
    opportunityRepo,
    funnelRepo,
    moveOpportunity,
    patientId: PATIENT_A,
    assertPatientExists,
    validateItemReferences,
    materializeBudgetTreatments,
    generateBudgetFinancialEntries,
    syncSalesOpportunity,
    createBudget,
    updateBudget,
    listBudgets,
    findBudgetById,
    deleteBudget,
    updateBudgetStatus,
  };
}

export function buildBudgetInput(
  overrides?: Partial<BudgetUpsertPayload>,
): BudgetUpsertPayload {
  return {
    description: 'Orçamento inicial',
    date: new Date('2026-07-01'),
    observations: 'Obs',
    responsibleId: 'prof-1',
    responsibleName: 'Dr. Silva',
    discount: null,
    installmentEnabled: false,
    downPaymentCents: 0,
    installmentsCount: 0,
    items: [
      {
        planId: PLAN_A,
        treatmentId: TREATMENT_A,
        professionalId: 'prof-1',
        professionalName: 'Dr. Silva',
        valueCents: 5000,
        locationType: 'none',
        locationLabel: '',
        sortOrder: 0,
      },
    ],
    ...overrides,
  };
}
