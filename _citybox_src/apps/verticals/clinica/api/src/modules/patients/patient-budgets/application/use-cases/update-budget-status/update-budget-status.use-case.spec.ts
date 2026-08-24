import { UpdateBudgetStatusUseCase } from './update-budget-status.use-case';
import { BudgetFrozenError } from '../../../domain/errors/budget-frozen.error';
import { ValidatorDomainError } from '../../../../../../shared/core/errors/validator-domain.error';
import {
  STORE_A,
  buildBudgetInput,
  createBudgetsTestHarness,
  PATIENT_A,
} from '../../../tests/budgets-test.fixtures';
import {
  createBudgetFixture,
  createBudgetItemFixture,
} from '../../../tests/in-memory-budget.repository';
import type { AccrueCommissionsOnBudgetApprovedService } from '../../../../../commissions/accruals/application/services/accrue-commissions-on-budget-approved.service';

describe('UpdateBudgetStatusUseCase', () => {
  it('approves a pending budget', async () => {
    const harness = createBudgetsTestHarness();
    const created = await harness.createBudget.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      input: buildBudgetInput(),
    });

    const detail = await harness.updateBudgetStatus.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      budgetId: created.budget.id,
      status: 'approved',
    });

    expect(detail.budget.status).toBe('approved');
    expect(detail.budget.approvedAt).not.toBeNull();
  });

  it('materializes patient treatments when approving a budget', async () => {
    const harness = createBudgetsTestHarness();
    const created = await harness.createBudget.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      input: buildBudgetInput(),
    });

    await harness.updateBudgetStatus.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      budgetId: created.budget.id,
      status: 'approved',
    });

    const treatments = await harness.treatmentRepo.findByPatient(
      STORE_A,
      PATIENT_A,
    );

    expect(treatments).toHaveLength(1);
    expect(treatments[0]?.source).toBe('budget');
    expect(treatments[0]?.budgetId).toBe(created.budget.id);
    expect(treatments[0]?.budgetItemId).toBe(created.items[0]?.id);
    expect(treatments[0]?.treatmentName).toBe('Consulta');
  });

  it('rejects a pending budget with date and reason', async () => {
    const harness = createBudgetsTestHarness();
    const created = await harness.createBudget.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      input: buildBudgetInput(),
    });

    const detail = await harness.updateBudgetStatus.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      budgetId: created.budget.id,
      status: 'rejected',
      rejectedAt: '2026-07-21',
      rejectionReason: 'Paciente desistiu do tratamento',
    });

    expect(detail.budget.status).toBe('rejected');
    expect(detail.budget.rejectedAt?.toISOString().slice(0, 10)).toBe(
      '2026-07-21',
    );
    expect(detail.budget.rejectionReason).toBe(
      'Paciente desistiu do tratamento',
    );
  });

  it('requires rejection reason when rejecting', async () => {
    const harness = createBudgetsTestHarness();
    const created = await harness.createBudget.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      input: buildBudgetInput(),
    });

    await expect(
      harness.updateBudgetStatus.execute({
        storeId: STORE_A,
        patientId: PATIENT_A,
        budgetId: created.budget.id,
        status: 'rejected',
        rejectedAt: '2026-07-21',
      }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });

  it('requires rejection date when rejecting', async () => {
    const harness = createBudgetsTestHarness();
    const created = await harness.createBudget.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      input: buildBudgetInput(),
    });

    await expect(
      harness.updateBudgetStatus.execute({
        storeId: STORE_A,
        patientId: PATIENT_A,
        budgetId: created.budget.id,
        status: 'rejected',
        rejectionReason: 'Sem data',
      }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });

  it('reopens a rejected budget to pending and clears rejection fields', async () => {
    const harness = createBudgetsTestHarness();
    const created = await harness.createBudget.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      input: buildBudgetInput(),
    });

    await harness.updateBudgetStatus.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      budgetId: created.budget.id,
      status: 'rejected',
      rejectedAt: '2026-07-21',
      rejectionReason: 'Motivo inicial',
    });

    const reopened = await harness.updateBudgetStatus.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      budgetId: created.budget.id,
      status: 'pending',
    });

    expect(reopened.budget.status).toBe('pending');
    expect(reopened.budget.rejectedAt).toBeNull();
    expect(reopened.budget.rejectionReason).toBeNull();
  });

  it('blocks rejected to expired transition', async () => {
    const harness = createBudgetsTestHarness();
    const budgetRepo = harness.budgetRepo;
    const budget = createBudgetFixture({
      storeId: STORE_A,
      patientId: PATIENT_A,
      status: 'rejected',
      rejectedAt: new Date('2026-07-21'),
      rejectionReason: 'Motivo',
    });
    budgetRepo.seed({
      budget,
      items: [createBudgetItemFixture(budget.id, STORE_A)],
    });

    await expect(
      harness.updateBudgetStatus.execute({
        storeId: STORE_A,
        patientId: PATIENT_A,
        budgetId: budget.id,
        status: 'expired',
      }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });

  it('expires a pending budget', async () => {
    const harness = createBudgetsTestHarness();
    const created = await harness.createBudget.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      input: buildBudgetInput(),
    });

    const detail = await harness.updateBudgetStatus.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      budgetId: created.budget.id,
      status: 'expired',
    });

    expect(detail.budget.status).toBe('expired');
  });

  it('blocks status change when approved', async () => {
    const harness = createBudgetsTestHarness();
    const budgetRepo = harness.budgetRepo;
    const budget = createBudgetFixture({
      storeId: STORE_A,
      patientId: PATIENT_A,
      status: 'approved',
    });
    budgetRepo.seed({
      budget,
      items: [createBudgetItemFixture(budget.id, STORE_A)],
    });

    const updateBudgetStatus = new UpdateBudgetStatusUseCase(
      budgetRepo,
      harness.assertPatientExists,
      harness.materializeBudgetTreatments,
      harness.generateBudgetFinancialEntries,
      {
        execute: async () => undefined,
      } as unknown as AccrueCommissionsOnBudgetApprovedService,
      harness.syncSalesOpportunity,
    );

    await expect(
      updateBudgetStatus.execute({
        storeId: STORE_A,
        patientId: PATIENT_A,
        budgetId: budget.id,
        status: 'rejected',
        rejectedAt: '2026-07-21',
        rejectionReason: 'Não deveria',
      }),
    ).rejects.toBeInstanceOf(BudgetFrozenError);
  });
});
