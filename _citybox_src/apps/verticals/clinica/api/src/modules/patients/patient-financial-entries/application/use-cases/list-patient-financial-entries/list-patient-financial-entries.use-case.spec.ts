import { PatientFinancialEntry } from '../../../domain/entities/patient-financial-entry.entity';
import { PatientFinancialEntryFrozenError } from '../../../domain/errors/patient-financial-entry-frozen.error';
import { Budget } from '../../../../patient-budgets/domain/entities/budget.entity';
import { createBudgetItemFixture } from '../../../../patient-budgets/tests/in-memory-budget.repository';
import {
  createPatientFinancialEntriesTestHarness,
  PATIENT_A,
  seedPatient,
  STORE_A,
} from '../../../tests/patient-financial-entries-test.fixtures';

const avulsoInput = {
  dueDate: new Date('2026-08-10'),
  observations: 'Observação teste',
  treatments: [
    {
      id: 'treatment-row-1',
      planId: 'plan-1',
      treatmentId: 'tr-1',
      treatmentName: 'Clareamento dental',
      valueCents: 80000,
      professionalId: 'prof-1',
      toothNumber: 11,
    },
  ],
};

describe('ListPatientFinancialEntriesUseCase', () => {
  it('lists entries with pagination and totals by period', async () => {
    const harness = createPatientFinancialEntriesTestHarness();
    seedPatient(harness);

    await harness.entryRepo.save(
      PatientFinancialEntry.create(
        {
          storeId: STORE_A,
          patientId: PATIENT_A,
          date: new Date('2026-07-10'),
          name: 'Pendente',
          valueCents: 10000,
          source: 'budget_approve',
        },
        'fin-1',
      ),
    );
    await harness.entryRepo.save(
      PatientFinancialEntry.create(
        {
          storeId: STORE_A,
          patientId: PATIENT_A,
          date: new Date('2026-07-15'),
          name: 'Recebido',
          valueCents: 25000,
          status: 'received',
          receivedAt: new Date('2026-07-15'),
          source: 'budget_approve',
        },
        'fin-2',
      ),
    );

    const result = await harness.listPatientFinancialEntries.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      page: 1,
      perPage: 10,
      periodFrom: '2026-07-01',
      periodTo: '2026-07-31',
      status: 'pending',
    });

    expect(result.total).toBe(1);
    expect(result.items.map((item) => item.id)).toEqual(['fin-1']);
    expect(result.totals).toEqual({
      receivedCents: 25000,
      pendingCents: 10000,
    });
  });
});

describe('CreatePatientFinancialEntryUseCase', () => {
  it('creates avulso debit with generated name and debitDetail snapshot', async () => {
    const harness = createPatientFinancialEntriesTestHarness();
    seedPatient(harness);

    const entry = await harness.createPatientFinancialEntry.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      input: avulsoInput,
    });

    expect(entry.name).toBe('Clareamento dental de Maria');
    expect(entry.valueCents).toBe(80000);
    expect(entry.source).toBe('avulso_debit');
    expect(entry.debitDetail?.treatments[0]?.value).toBe('800,00');
  });
});

describe('UpdatePatientFinancialEntryUseCase', () => {
  it('updates pending budget_approve installment value and observations', async () => {
    const harness = createPatientFinancialEntriesTestHarness();
    seedPatient(harness);

    await harness.entryRepo.save(
      PatientFinancialEntry.create(
        {
          storeId: STORE_A,
          patientId: PATIENT_A,
          date: new Date('2026-07-10'),
          name: '1/4 — Orçamento',
          valueCents: 10000,
          source: 'budget_approve',
        },
        'fin-budget',
      ),
    );

    const updated = await harness.updatePatientFinancialEntry.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      entryId: 'fin-budget',
      input: {
        observations: 'Obs pagamento',
        valueCents: 12500,
      },
    });

    expect(updated.valueCents).toBe(12500);
    expect(updated.debitDetail?.observations).toBe('Obs pagamento');
  });

  it('updates pending avulso treatment value and professional', async () => {
    const harness = createPatientFinancialEntriesTestHarness();
    seedPatient(harness);

    const created = await harness.createPatientFinancialEntry.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      input: avulsoInput,
    });

    const treatmentId = created.debitDetail!.treatments[0]!.id;
    const updated = await harness.updatePatientFinancialEntry.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      entryId: created.id,
      input: {
        observations: 'Atualizado',
        treatments: [
          {
            id: treatmentId,
            valueCents: 90000,
            professionalId: 'prof-2',
          },
        ],
      },
    });

    expect(updated.valueCents).toBe(90000);
    expect(updated.debitDetail?.observations).toBe('Atualizado');
    expect(updated.debitDetail?.treatments[0]?.professionalId).toBe('prof-2');
    expect(updated.debitDetail?.treatments[0]?.value).toBe('900,00');
  });

  it('rejects update when entry is already received', async () => {
    const harness = createPatientFinancialEntriesTestHarness();
    seedPatient(harness);

    await harness.entryRepo.save(
      PatientFinancialEntry.create(
        {
          storeId: STORE_A,
          patientId: PATIENT_A,
          date: new Date('2026-07-10'),
          name: 'Recebido',
          valueCents: 10000,
          status: 'received',
          receivedAt: new Date('2026-07-12'),
          source: 'budget_approve',
        },
        'fin-received',
      ),
    );

    await expect(
      harness.updatePatientFinancialEntry.execute({
        storeId: STORE_A,
        patientId: PATIENT_A,
        entryId: 'fin-received',
        input: {
          observations: '',
          valueCents: 11000,
        },
      }),
    ).rejects.toBeInstanceOf(PatientFinancialEntryFrozenError);
  });
});

describe('ReceivePatientFinancialEntryUseCase', () => {
  it('marks pending entry as received with receiveDetail', async () => {
    const harness = createPatientFinancialEntriesTestHarness();
    seedPatient(harness);

    await harness.entryRepo.save(
      PatientFinancialEntry.create(
        {
          storeId: STORE_A,
          patientId: PATIENT_A,
          date: new Date('2026-07-10'),
          name: 'Pendente',
          valueCents: 10000,
          source: 'budget_approve',
        },
        'fin-pending',
      ),
    );

    const received = await harness.receivePatientFinancialEntry.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      entryId: 'fin-pending',
      input: {
        paymentMethod: 'pix',
        paidValueCents: 10000,
        receivedAt: new Date('2026-07-12'),
        cashRegisterId: 'caixa-001',
        observations: '',
      },
    });

    expect(received.status).toBe('received');
    expect(received.receiveDetail?.paymentMethod).toBe('pix');
  });
});

describe('GenerateBudgetFinancialEntriesService', () => {
  it('without installment: one entry per item with plain procedure name', async () => {
    const harness = createPatientFinancialEntriesTestHarness();
    seedPatient(harness);
    const budget = Budget.create(
      {
        storeId: STORE_A,
        patientId: PATIENT_A,
        description: 'Plano de Procedimento de Maria',
        date: new Date('2026-06-10'),
        observations: '',
        responsibleId: 'resp-1',
        responsibleName: 'Dr. João',
        discountType: null,
        discountValue: null,
        subtotalCents: 126290,
        finalValueCents: 126290,
        installmentEnabled: false,
        downPaymentCents: 0,
        installmentsCount: 0,
        status: 'approved',
        approvedAt: new Date('2026-06-10'),
      },
      'budget-1',
    );

    const items = [1, 2, 3, 4, 5].map((index) =>
      createBudgetItemFixture(
        budget.id,
        STORE_A,
        {
          treatmentId: 'alveoloplastia',
          treatmentName: 'Alveoloplastia',
          valueCents: 25258,
          sortOrder: index,
        },
        `item-${index}`,
      ),
    );

    await harness.generateBudgetFinancialEntries.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      budget,
      items,
    });
    await harness.generateBudgetFinancialEntries.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      budget,
      items,
    });

    const listed = await harness.listPatientFinancialEntries.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      page: 1,
      perPage: 20,
      sortBy: 'name',
      sortOrder: 'asc',
    });

    expect(listed.total).toBe(5);
    expect(listed.items.map((item) => item.name)).toEqual([
      'Alveoloplastia',
      'Alveoloplastia',
      'Alveoloplastia',
      'Alveoloplastia',
      'Alveoloplastia',
    ]);
    expect(listed.items.every((item) => item.debitDetail?.treatments.length === 1)).toBe(
      true,
    );
    expect(listed.items.every((item) => item.valueCents === 25258)).toBe(true);
    expect(
      listed.items.map((item) => item.budgetItemId).sort(),
    ).toEqual(['item-1', 'item-2', 'item-3', 'item-4', 'item-5']);
  });

  it('without installment: prorates discount so entry totals match finalValueCents', async () => {
    const harness = createPatientFinancialEntriesTestHarness();
    seedPatient(harness);
    const budget = Budget.create(
      {
        storeId: STORE_A,
        patientId: PATIENT_A,
        description: 'Com desconto',
        date: new Date('2026-06-10'),
        observations: '',
        responsibleId: 'resp-1',
        responsibleName: 'Dr. João',
        discountType: 'fixed',
        discountValue: 1000,
        subtotalCents: 10000,
        finalValueCents: 9000,
        installmentEnabled: false,
        downPaymentCents: 0,
        installmentsCount: 0,
        status: 'approved',
        approvedAt: new Date('2026-06-10'),
      },
      'budget-discount',
    );

    const items = [
      createBudgetItemFixture(
        budget.id,
        STORE_A,
        {
          treatmentId: 't-a',
          treatmentName: 'Proc A',
          valueCents: 6000,
          sortOrder: 0,
        },
        'item-a',
      ),
      createBudgetItemFixture(
        budget.id,
        STORE_A,
        {
          treatmentId: 't-b',
          treatmentName: 'Proc B',
          valueCents: 4000,
          sortOrder: 1,
        },
        'item-b',
      ),
    ];

    await harness.generateBudgetFinancialEntries.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      budget,
      items,
    });

    const listed = await harness.listPatientFinancialEntries.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      page: 1,
      perPage: 20,
      sortBy: 'name',
      sortOrder: 'asc',
    });

    expect(listed.total).toBe(2);
    expect(listed.items.map((item) => item.name)).toEqual(['Proc A', 'Proc B']);
    expect(listed.items.reduce((sum, item) => sum + item.valueCents, 0)).toBe(
      9000,
    );
  });

  it('with installment: generates Entrada and k/N parcel lines', async () => {
    const harness = createPatientFinancialEntriesTestHarness();
    seedPatient(harness);
    const budget = Budget.create(
      {
        storeId: STORE_A,
        patientId: PATIENT_A,
        description: 'Plano parcelado',
        date: new Date('2026-06-10'),
        observations: '',
        responsibleId: 'resp-1',
        responsibleName: 'Dr. João',
        discountType: null,
        discountValue: null,
        subtotalCents: 10000,
        finalValueCents: 10000,
        installmentEnabled: true,
        downPaymentCents: 1000,
        installmentsCount: 3,
        status: 'approved',
        approvedAt: new Date('2026-06-10'),
      },
      'budget-installment',
    );

    const items = [
      createBudgetItemFixture(
        budget.id,
        STORE_A,
        {
          treatmentId: 't-a',
          treatmentName: 'Proc A',
          valueCents: 10000,
          sortOrder: 0,
        },
        'item-a',
      ),
    ];

    await harness.generateBudgetFinancialEntries.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      budget,
      items,
    });

    const listed = await harness.listPatientFinancialEntries.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      page: 1,
      perPage: 20,
      sortBy: 'name',
      sortOrder: 'asc',
    });

    expect(listed.total).toBe(4);
    expect(listed.items.map((item) => item.name)).toEqual([
      '1/3 — Plano parcelado',
      '2/3 — Plano parcelado',
      '3/3 — Plano parcelado',
      'Entrada — Plano parcelado',
    ]);
    expect(listed.items.reduce((sum, item) => sum + item.valueCents, 0)).toBe(
      10000,
    );
    expect(listed.items.every((item) => item.budgetItemId == null)).toBe(true);
  });

  it('with installment: uses custom schedule due dates and values', async () => {
    const harness = createPatientFinancialEntriesTestHarness();
    seedPatient(harness);
    const budget = Budget.create(
      {
        storeId: STORE_A,
        patientId: PATIENT_A,
        description: 'Plano custom',
        date: new Date('2026-06-10'),
        observations: '',
        responsibleId: 'resp-1',
        responsibleName: 'Dr. João',
        discountType: null,
        discountValue: null,
        subtotalCents: 10000,
        finalValueCents: 10000,
        installmentEnabled: true,
        downPaymentCents: 0,
        installmentsCount: 2,
        status: 'approved',
        approvedAt: new Date('2026-06-10'),
      },
      'budget-custom-installments',
    );

    const items = [
      createBudgetItemFixture(
        budget.id,
        STORE_A,
        {
          treatmentId: 't-a',
          treatmentName: 'Proc A',
          valueCents: 10000,
          sortOrder: 0,
        },
        'item-a',
      ),
    ];

    await harness.generateBudgetFinancialEntries.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      budget,
      items,
      dueDate: new Date('2026-08-20T00:00:00.000Z'),
      installments: [
        { dueDate: new Date('2026-08-20T00:00:00.000Z'), valueCents: 4000 },
        { dueDate: new Date('2026-09-20T00:00:00.000Z'), valueCents: 6000 },
      ],
    });

    const listed = await harness.listPatientFinancialEntries.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      page: 1,
      perPage: 20,
      sortBy: 'name',
      sortOrder: 'asc',
    });

    expect(listed.total).toBe(2);
    expect(listed.items.map((item) => item.name)).toEqual([
      '1/2 — Plano custom',
      '2/2 — Plano custom',
    ]);
    expect(listed.items.map((item) => item.valueCents)).toEqual([4000, 6000]);
    expect(
      listed.items.map((item) => item.date.toISOString().slice(0, 10)),
    ).toEqual(['2026-08-20', '2026-09-20']);
  });

  it('filters by budgetItemId', async () => {
    const harness = createPatientFinancialEntriesTestHarness();
    seedPatient(harness);
    const budget = Budget.create(
      {
        storeId: STORE_A,
        patientId: PATIENT_A,
        description: 'Plano',
        date: new Date('2026-06-10'),
        observations: '',
        responsibleId: 'resp-1',
        responsibleName: 'Dr. João',
        discountType: null,
        discountValue: null,
        subtotalCents: 10000,
        finalValueCents: 10000,
        installmentEnabled: false,
        downPaymentCents: 0,
        installmentsCount: 1,
        status: 'approved',
        approvedAt: new Date('2026-06-10'),
      },
      'budget-filter',
    );

    const items = [
      createBudgetItemFixture(
        budget.id,
        STORE_A,
        {
          treatmentId: 't-a',
          treatmentName: 'A',
          valueCents: 5000,
          sortOrder: 0,
        },
        'item-filter-a',
      ),
      createBudgetItemFixture(
        budget.id,
        STORE_A,
        {
          treatmentId: 't-b',
          treatmentName: 'B',
          valueCents: 5000,
          sortOrder: 1,
        },
        'item-filter-b',
      ),
    ];

    await harness.generateBudgetFinancialEntries.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      budget,
      items,
    });

    const listed = await harness.listPatientFinancialEntries.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      page: 1,
      perPage: 20,
      budgetItemId: 'item-filter-b',
    });

    expect(listed.total).toBe(1);
    expect(listed.items[0]?.budgetItemId).toBe('item-filter-b');
    expect(listed.items[0]?.name).toBe('B');
  });
});
