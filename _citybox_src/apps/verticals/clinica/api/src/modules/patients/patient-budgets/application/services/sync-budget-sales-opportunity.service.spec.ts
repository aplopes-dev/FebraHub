import {
  STORE_A,
  buildBudgetInput,
  createBudgetsTestHarness,
  PATIENT_A,
} from '../../tests/budgets-test.fixtures';
import { SalesOpportunityBudgetTerminalMoveError } from '../../../../sales/opportunities/domain/errors/sales-opportunity-budget-terminal-move.error';

describe('SyncBudgetSalesOpportunityService (via budgets)', () => {
  it('creates a Funil de Venda card in Em aberto when budget is created', async () => {
    const { createBudget, opportunityRepo, funnelRepo } =
      createBudgetsTestHarness();

    const detail = await createBudget.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      input: buildBudgetInput(),
    });

    const opportunity = await opportunityRepo.findByBudgetId(
      STORE_A,
      detail.budget.id,
    );
    expect(opportunity).not.toBeNull();
    expect(opportunity!.origin).toBe('budget');
    expect(opportunity!.budgetId).toBe(detail.budget.id);
    expect(opportunity!.patientId).toBe(PATIENT_A);
    expect(opportunity!.title).toBe('Paciente Budget');

    const funnel = await funnelRepo.findById(STORE_A, opportunity!.funnelId);
    expect(funnel?.name).toBe('Funil de Venda');
    const stage = funnel?.findStage(opportunity!.stageId);
    expect(stage?.name).toBe('Em aberto');
    expect(stage?.type).toBe('others');
  });

  it('moves card to Ganha when budget is approved', async () => {
    const { createBudget, updateBudgetStatus, opportunityRepo, funnelRepo } =
      createBudgetsTestHarness();

    const detail = await createBudget.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      input: buildBudgetInput(),
    });

    await updateBudgetStatus.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      budgetId: detail.budget.id,
      status: 'approved',
    });

    const opportunity = await opportunityRepo.findByBudgetId(
      STORE_A,
      detail.budget.id,
    );
    const funnel = await funnelRepo.findById(STORE_A, opportunity!.funnelId);
    const stage = funnel?.findStage(opportunity!.stageId);
    expect(stage?.type).toBe('won');
    expect(stage?.name).toBe('Ganha');
    expect(opportunity!.isTerminal).toBe(true);
  });

  it('moves card to Perdida when budget is rejected', async () => {
    const { createBudget, updateBudgetStatus, opportunityRepo, funnelRepo } =
      createBudgetsTestHarness();

    const detail = await createBudget.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      input: buildBudgetInput(),
    });

    await updateBudgetStatus.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      budgetId: detail.budget.id,
      status: 'rejected',
      rejectedAt: '2026-08-01',
      rejectionReason: 'Paciente desistiu',
    });

    const opportunity = await opportunityRepo.findByBudgetId(
      STORE_A,
      detail.budget.id,
    );
    const funnel = await funnelRepo.findById(STORE_A, opportunity!.funnelId);
    const stage = funnel?.findStage(opportunity!.stageId);
    expect(stage?.type).toBe('lost');
    expect(stage?.name).toBe('Perdida');
  });

  it('moves card back to Em aberto when budget is reopened', async () => {
    const { createBudget, updateBudgetStatus, opportunityRepo, funnelRepo } =
      createBudgetsTestHarness();

    const detail = await createBudget.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      input: buildBudgetInput(),
    });

    await updateBudgetStatus.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      budgetId: detail.budget.id,
      status: 'rejected',
      rejectedAt: '2026-08-01',
      rejectionReason: 'Paciente desistiu',
    });

    await updateBudgetStatus.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      budgetId: detail.budget.id,
      status: 'pending',
    });

    const opportunity = await opportunityRepo.findByBudgetId(
      STORE_A,
      detail.budget.id,
    );
    const funnel = await funnelRepo.findById(STORE_A, opportunity!.funnelId);
    const stage = funnel?.findStage(opportunity!.stageId);
    expect(stage?.name).toBe('Em aberto');
    expect(opportunity!.isTerminal).toBe(false);
  });

  it('moves card to Perdida when budget expires', async () => {
    const { createBudget, updateBudgetStatus, opportunityRepo, funnelRepo } =
      createBudgetsTestHarness();

    const detail = await createBudget.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      input: buildBudgetInput(),
    });

    await updateBudgetStatus.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      budgetId: detail.budget.id,
      status: 'expired',
    });

    const opportunity = await opportunityRepo.findByBudgetId(
      STORE_A,
      detail.budget.id,
    );
    const funnel = await funnelRepo.findById(STORE_A, opportunity!.funnelId);
    const stage = funnel?.findStage(opportunity!.stageId);
    expect(stage?.type).toBe('lost');
  });

  it('deletes linked opportunity when pending budget is deleted', async () => {
    const { createBudget, deleteBudget, opportunityRepo } =
      createBudgetsTestHarness();

    const detail = await createBudget.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      input: buildBudgetInput(),
    });

    await deleteBudget.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      budgetId: detail.budget.id,
    });

    const opportunity = await opportunityRepo.findByBudgetId(
      STORE_A,
      detail.budget.id,
    );
    expect(opportunity).toBeNull();
  });

  it('blocks CRM move of budget card to won/lost', async () => {
    const {
      createBudget,
      opportunityRepo,
      funnelRepo,
      moveOpportunity,
    } = createBudgetsTestHarness();

    const detail = await createBudget.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      input: buildBudgetInput(),
    });

    const opportunity = await opportunityRepo.findByBudgetId(
      STORE_A,
      detail.budget.id,
    );
    const funnel = await funnelRepo.findById(STORE_A, opportunity!.funnelId);
    const won = funnel!.stages.find((s) => s.type === 'won')!;
    const inProgress = funnel!.stages.find(
      (s) => s.type === 'others' && s.name === 'Em andamento',
    )!;

    await expect(
      moveOpportunity.execute({
        storeId: STORE_A,
        id: opportunity!.id,
        stageId: won.id,
        actor: { sub: 'user-1', roles: [], name: 'Operador' },
      }),
    ).rejects.toBeInstanceOf(SalesOpportunityBudgetTerminalMoveError);

    const moved = await moveOpportunity.execute({
      storeId: STORE_A,
      id: opportunity!.id,
      stageId: inProgress.id,
      actor: { sub: 'user-1', roles: [], name: 'Operador' },
    });
    expect(moved.stageId).toBe(inProgress.id);
  });
});
