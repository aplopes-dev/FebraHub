import { BadRequestException } from '@nestjs/common';
import { FinancialEntry } from '../../../../financial/entries/domain/entities/financial-entry.entity';
import { InMemoryFinancialEntryRepository } from '../../../../financial/entries/tests/in-memory-financial-entry.repository';
import {
  createBudgetFixture,
  createBudgetItemFixture,
  InMemoryBudgetRepository,
} from '../../../../patients/patient-budgets/tests/in-memory-budget.repository';
import { InMemoryPatientTreatmentRepository } from '../../../../patients/patient-treatments/tests/in-memory-patient-treatment.repository';
import { DashboardRevenueBuilder } from '../../utils/dashboard-revenue.builder';
import { GetDashboardRevenueAnalysisUseCase } from './get-dashboard-revenue-analysis.use-case';
import { ListDashboardRevenueDetailsUseCase } from '../list-dashboard-revenue-details/list-dashboard-revenue-details.use-case';

describe('Dashboard revenue analysis', () => {
  const storeId = 'store-1';
  const now = new Date('2026-07-17T12:00:00.000Z');

  function createHarness() {
    const budgetRepo = new InMemoryBudgetRepository();
    const treatmentRepo = new InMemoryPatientTreatmentRepository();
    const financialRepo = new InMemoryFinancialEntryRepository();
    const prisma = {
      clinicPlanTreatment: {
        findMany: async () =>
          [
            {
              id: 'tr-clareamento',
              specialtyId: 'spec-estetica',
              plan: { name: 'Estética' },
              specialty: { id: 'spec-estetica', name: 'Estética facial' },
            },
            {
              id: 'tr-consulta',
              specialtyId: 'spec-geral',
              plan: { name: 'Preventivo' },
              specialty: { id: 'spec-geral', name: 'Clínica geral' },
            },
          ] as Array<{
            id: string;
            specialtyId: string;
            plan: { name: string };
            specialty: { id: string; name: string };
          }>,
      },
    };

    const builder = new DashboardRevenueBuilder(
      budgetRepo,
      treatmentRepo,
      financialRepo,
      prisma as never,
    );

    return {
      budgetRepo,
      treatmentRepo,
      financialRepo,
      analysis: new GetDashboardRevenueAnalysisUseCase(builder),
      details: new ListDashboardRevenueDetailsUseCase(builder),
    };
  }

  it('aggregates received income by professional with budget item allocation', async () => {
    const harness = createHarness();
    harness.budgetRepo.seedPatientName('patient-1', 'Ana Souza');

    const budget = createBudgetFixture(
      {
        storeId,
        patientId: 'patient-1',
        status: 'approved',
        approvedAt: new Date('2026-07-10T12:00:00.000Z'),
        finalValueCents: 30_000,
        subtotalCents: 30_000,
      },
      'budget-1',
    );
    harness.budgetRepo.seed({
      budget,
      items: [
        createBudgetItemFixture(
          budget.id,
          storeId,
          {
            professionalId: 'prof-marina',
            professionalName: 'Dra. Marina',
            planId: 'plan-estetica',
            planName: 'Estética',
            treatmentId: 'tr-clareamento',
            treatmentName: 'Clareamento',
            valueCents: 20_000,
          },
          'item-1',
        ),
        createBudgetItemFixture(
          budget.id,
          storeId,
          {
            professionalId: 'prof-carlos',
            professionalName: 'Dr. Carlos',
            planId: 'plan-preventivo',
            planName: 'Preventivo',
            treatmentId: 'tr-consulta',
            treatmentName: 'Consulta',
            valueCents: 10_000,
          },
          'item-2',
        ),
      ],
    });

    harness.financialRepo.seedPatientName('patient-1', 'Ana Souza');
    harness.financialRepo.seed([
      FinancialEntry.create(
        {
          storeId,
          type: 'income',
          status: 'received',
          source: 'budget_approve',
          description: 'Parcela 1',
          valueCents: 15_000,
          paidValueCents: 15_000,
          dueDate: new Date('2026-07-10T00:00:00.000Z'),
          paidAt: new Date('2026-07-17T00:00:00.000Z'),
          patientId: 'patient-1',
          budgetId: 'budget-1',
        },
        'entry-1',
      ),
      FinancialEntry.create(
        {
          storeId,
          type: 'income',
          status: 'pending',
          source: 'budget_approve',
          description: 'Parcela pendente',
          valueCents: 15_000,
          dueDate: new Date('2026-07-17T00:00:00.000Z'),
          patientId: 'patient-1',
          budgetId: 'budget-1',
        },
        'entry-pending',
      ),
    ]);

    const result = await harness.analysis.execute({
      storeId,
      mode: 'receipts',
      dimension: 'professionals',
      period: 'today',
      now,
    });

    expect(result.items).toEqual([
      {
        key: 'prof-marina',
        name: 'Dra. Marina',
        count: 1,
        totalCents: 10_000,
      },
      {
        key: 'prof-carlos',
        name: 'Dr. Carlos',
        count: 1,
        totalCents: 5_000,
      },
    ]);
  });

  it('aggregates sales from approved budgets, standalone treatments and avulso', async () => {
    const harness = createHarness();
    const patient1 = '11111111-1111-4111-8111-111111111111';
    const patient2 = '22222222-2222-4222-8222-222222222222';
    const patient3 = '33333333-3333-4333-8333-333333333333';
    const treatmentStandaloneId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const treatmentBudgetId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

    harness.budgetRepo.seedPatientName(patient1, 'Ana Souza');
    harness.treatmentRepo.seedPatientName(patient2, 'Bruno Lima');
    harness.financialRepo.seedPatientName(patient3, 'Carla Dias');

    const budget = createBudgetFixture(
      {
        storeId,
        patientId: patient1,
        status: 'approved',
        approvedAt: new Date('2026-07-17T08:00:00.000Z'),
        finalValueCents: 20_000,
        subtotalCents: 20_000,
      },
      'budget-approved',
    );
    harness.budgetRepo.seed({
      budget,
      items: [
        createBudgetItemFixture(
          budget.id,
          storeId,
          {
            professionalId: 'prof-marina',
            professionalName: 'Dra. Marina',
            treatmentId: 'tr-clareamento',
            treatmentName: 'Clareamento',
            valueCents: 20_000,
          },
          'item-approved',
        ),
      ],
    });

    harness.treatmentRepo.seed(
      {
        storeId,
        patientId: patient2,
        source: 'standalone',
        status: 'active',
        planId: 'plan-preventivo',
        treatmentId: 'tr-consulta',
        professionalId: 'prof-carlos',
        professionalName: 'Dr. Carlos',
        planName: 'Preventivo',
        treatmentName: 'Consulta avulsa',
        description: '',
        valueCents: 8_000,
        locationType: 'none',
        locationLabel: '',
        diagnosis: '',
        observation: '',
        sortOrder: 0,
        finalizedAt: null,
        createdAt: new Date('2026-07-17T10:00:00.000Z'),
      },
      treatmentStandaloneId,
    );

    // budget-sourced active treatment must NOT appear (avoid double count)
    harness.treatmentRepo.seed(
      {
        storeId,
        patientId: patient1,
        source: 'budget',
        status: 'active',
        planId: 'plan-estetica',
        treatmentId: 'tr-clareamento',
        professionalId: 'prof-marina',
        professionalName: 'Dra. Marina',
        planName: 'Estética',
        treatmentName: 'Clareamento',
        description: '',
        valueCents: 20_000,
        locationType: 'none',
        locationLabel: '',
        diagnosis: '',
        observation: '',
        sortOrder: 0,
        finalizedAt: null,
        budgetId: 'budget-approved',
        createdAt: new Date('2026-07-17T09:00:00.000Z'),
      },
      treatmentBudgetId,
    );

    harness.financialRepo.seed([
      FinancialEntry.create(
        {
          storeId,
          type: 'income',
          status: 'pending',
          source: 'avulso_debit',
          description: 'Débito avulso',
          valueCents: 5_000,
          dueDate: new Date('2026-07-17T00:00:00.000Z'),
          patientId: patient3,
          debitDetail: {
            observations: '',
            treatments: [
              {
                id: 'dt-1',
                planId: 'plan-estetica',
                treatmentId: 'tr-clareamento',
                treatmentName: 'Retoque',
                value: '50,00',
                professionalId: 'prof-marina',
              },
            ],
          },
        },
        'entry-avulso',
      ),
    ]);

    const result = await harness.analysis.execute({
      storeId,
      mode: 'sales',
      dimension: 'professionals',
      period: 'today',
      now,
    });

    expect(result.items).toEqual([
      {
        key: 'prof-marina',
        name: 'Dra. Marina',
        count: 2,
        totalCents: 25_000,
      },
      {
        key: 'prof-carlos',
        name: 'Dr. Carlos',
        count: 1,
        totalCents: 8_000,
      },
    ]);
  });

  it('ignores other store and supports specialty dimension', async () => {
    const harness = createHarness();
    harness.budgetRepo.seedPatientName('patient-1', 'Ana Souza');

    const budget = createBudgetFixture(
      {
        storeId,
        patientId: 'patient-1',
        status: 'approved',
        approvedAt: new Date('2026-07-17T08:00:00.000Z'),
        finalValueCents: 20_000,
        subtotalCents: 20_000,
      },
      'budget-1',
    );
    harness.budgetRepo.seed({
      budget,
      items: [
        createBudgetItemFixture(
          budget.id,
          storeId,
          {
            treatmentId: 'tr-clareamento',
            treatmentName: 'Clareamento',
            valueCents: 20_000,
          },
          'item-1',
        ),
      ],
    });

    const other = createBudgetFixture(
      {
        storeId: 'store-2',
        patientId: 'patient-x',
        status: 'approved',
        approvedAt: new Date('2026-07-17T08:00:00.000Z'),
        finalValueCents: 99_000,
        subtotalCents: 99_000,
      },
      'budget-other',
    );
    harness.budgetRepo.seed({
      budget: other,
      items: [
        createBudgetItemFixture(other.id, 'store-2', {
          treatmentId: 'tr-clareamento',
          valueCents: 99_000,
        }),
      ],
    });

    const result = await harness.analysis.execute({
      storeId,
      mode: 'sales',
      dimension: 'specialties',
      period: 'today',
      now,
    });

    expect(result.items).toEqual([
      {
        key: 'spec-estetica',
        name: 'Estética facial',
        count: 1,
        totalCents: 20_000,
      },
    ]);
  });

  it('lists paginated details with search and totalValueCents', async () => {
    const harness = createHarness();
    harness.budgetRepo.seedPatientName('patient-1', 'Ana Souza');
    harness.budgetRepo.seedPatientName('patient-2', 'Bruno Lima');

    for (const [index, patientId] of ['patient-1', 'patient-2'].entries()) {
      const budget = createBudgetFixture(
        {
          storeId,
          patientId,
          status: 'approved',
          approvedAt: new Date('2026-07-17T08:00:00.000Z'),
          finalValueCents: 10_000,
          subtotalCents: 10_000,
        },
        `budget-${index}`,
      );
      harness.budgetRepo.seed({
        budget,
        items: [
          createBudgetItemFixture(
            budget.id,
            storeId,
            {
              professionalId: 'prof-marina',
              professionalName: 'Dra. Marina',
              treatmentId: 'tr-clareamento',
              treatmentName: `Tratamento ${index}`,
              valueCents: 10_000,
            },
            `item-${index}`,
          ),
        ],
      });
    }

    const page1 = await harness.details.execute({
      storeId,
      mode: 'sales',
      dimension: 'professionals',
      dimensionKey: 'prof-marina',
      period: 'today',
      page: 1,
      perPage: 1,
      now,
    });

    expect(page1.total).toBe(2);
    expect(page1.totalValueCents).toBe(20_000);
    expect(page1.totalPages).toBe(2);
    expect(page1.items).toHaveLength(1);

    const filtered = await harness.details.execute({
      storeId,
      mode: 'sales',
      dimension: 'professionals',
      dimensionKey: 'prof-marina',
      period: 'today',
      search: 'Bruno',
      now,
    });

    expect(filtered.total).toBe(1);
    expect(filtered.items[0]?.patientName).toBe('Bruno Lima');
  });

  it('rejects custom period without dates and missing dimensionKey', async () => {
    const harness = createHarness();

    await expect(
      harness.analysis.execute({
        storeId,
        period: 'custom',
        now,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      harness.details.execute({
        storeId,
        dimensionKey: '',
        now,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('omits manual receipts without clinical dimension from every tab', async () => {
    const harness = createHarness();
    harness.financialRepo.seedPatientName('patient-1', 'Ana Souza');
    harness.financialRepo.seed([
      FinancialEntry.create(
        {
          storeId,
          type: 'income',
          status: 'received',
          source: 'manual',
          description: 'Receita manual do caixa',
          valueCents: 56_500,
          paidValueCents: 56_500,
          dueDate: new Date('2026-07-17T00:00:00.000Z'),
          paidAt: new Date('2026-07-17T00:00:00.000Z'),
          patientId: 'patient-1',
        },
        'entry-manual',
      ),
    ]);

    for (const dimension of [
      'professionals',
      'plans',
      'treatments',
      'specialties',
    ] as const) {
      const result = await harness.analysis.execute({
        storeId,
        mode: 'receipts',
        dimension,
        period: 'today',
        now,
      });
      expect(result.items).toEqual([]);
    }
  });

  it('includeWithoutRevenue adds zero buckets from sales for treatments', async () => {
    const harness = createHarness();
    harness.budgetRepo.seedPatientName('patient-1', 'Ana Souza');

    const budget = createBudgetFixture(
      {
        storeId,
        patientId: 'patient-1',
        status: 'approved',
        approvedAt: new Date('2026-07-17T08:00:00.000Z'),
        finalValueCents: 20_000,
        subtotalCents: 20_000,
      },
      'budget-1',
    );
    harness.budgetRepo.seed({
      budget,
      items: [
        createBudgetItemFixture(
          budget.id,
          storeId,
          {
            treatmentId: 'tr-clareamento',
            treatmentName: 'Clareamento',
            valueCents: 20_000,
          },
          'item-1',
        ),
      ],
    });

    const without = await harness.analysis.execute({
      storeId,
      mode: 'receipts',
      dimension: 'treatments',
      period: 'today',
      includeWithoutRevenue: true,
      now,
    });

    expect(without.items).toEqual([
      {
        key: 'tr-clareamento',
        name: 'Clareamento',
        count: 0,
        totalCents: 0,
      },
    ]);
  });
});
