import { FinancialEntry } from '../../../../financial/entries/domain/entities/financial-entry.entity';
import { InMemoryFinancialEntryRepository } from '../../../../financial/entries/tests/in-memory-financial-entry.repository';
import { Patient } from '../../../../patients/domain/entities/patient.entity';
import {
  createBudgetFixture,
  InMemoryBudgetRepository,
} from '../../../../patients/patient-budgets/tests/in-memory-budget.repository';
import { InMemoryPatientRepository } from '../../../../patients/tests/in-memory-patient.repository';
import { GetDashboardSummaryUseCase } from './get-dashboard-summary.use-case';

describe('GetDashboardSummaryUseCase', () => {
  const today = new Date('2026-07-17T12:00:00.000Z');
  const storeId = 'store-1';
  const categoryId = '11111111-1111-4111-8111-111111111111';

  function createUseCase(
    entryRepo = new InMemoryFinancialEntryRepository(),
    budgetRepo = new InMemoryBudgetRepository(),
    patientRepo = new InMemoryPatientRepository(),
  ) {
    return {
      entryRepo,
      budgetRepo,
      patientRepo,
      useCase: new GetDashboardSummaryUseCase(
        entryRepo,
        budgetRepo,
        patientRepo,
      ),
    };
  }

  function seedPatient(
    patientRepo: InMemoryPatientRepository,
    overrides: {
      id: string;
      storeId?: string;
      status?: 'active' | 'inactive';
      birthDate?: Date | null;
      name?: string;
    },
  ) {
    const patient = Patient.create(
      {
        storeId: overrides.storeId ?? storeId,
        status: overrides.status ?? 'active',
        name: overrides.name ?? 'Paciente',
        cpf: null,
        rg: '',
        birthDate: overrides.birthDate ?? null,
        gender: 'female',
        photoObjectKey: null,
        photoMimeType: null,
        phone: '',
        landlinePhone: '',
        email: '',
        socialNetwork: '',
        medicalRecordNumber: '',
        referralOriginId: null,
        profession: '',
        categoryId,
        guardianName: '',
        guardianBirthDate: null,
        guardianCpf: null,
        guardianPhone: '',
        guardianNotes: '',
        zipCode: '',
        street: '',
        streetNumber: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        planId: null,
        planNumber: '',
        planHolderName: '',
        planHolderCpf: null,
      },
      overrides.id,
    );
    void patientRepo.save(patient);
  }

  it('sums overdue income, open/rejected budgets and upcoming birthdays', async () => {
    const { entryRepo, budgetRepo, patientRepo, useCase } = createUseCase();

    entryRepo.seed([
      FinancialEntry.create({
        storeId,
        type: 'income',
        source: 'manual',
        description: 'Atrasado 1',
        valueCents: 150000,
        dueDate: new Date('2026-06-10T00:00:00.000Z'),
        status: 'pending',
      }),
      FinancialEntry.create({
        storeId,
        type: 'income',
        source: 'manual',
        description: 'Atrasado 2',
        valueCents: 28000,
        dueDate: new Date('2026-07-01T00:00:00.000Z'),
        status: 'pending',
      }),
      FinancialEntry.create({
        storeId,
        type: 'income',
        source: 'manual',
        description: 'Vence hoje',
        valueCents: 99999,
        dueDate: new Date('2026-07-17T00:00:00.000Z'),
        status: 'pending',
      }),
      FinancialEntry.create({
        storeId: 'store-2',
        type: 'income',
        source: 'manual',
        description: 'Outra loja',
        valueCents: 44444,
        dueDate: new Date('2026-06-01T00:00:00.000Z'),
        status: 'pending',
      }),
    ]);

    budgetRepo.seed({
      budget: createBudgetFixture(
        {
          storeId,
          patientId: 'pat-1',
          status: 'pending',
          finalValueCents: 100000,
        },
        'bud-pending',
      ),
      items: [],
    });
    budgetRepo.seed({
      budget: createBudgetFixture(
        {
          storeId,
          patientId: 'pat-1',
          status: 'rejected',
          finalValueCents: 50000,
          rejectedAt: new Date('2026-07-10'),
          rejectionReason: 'Desistiu',
        },
        'bud-rejected',
      ),
      items: [],
    });
    budgetRepo.seed({
      budget: createBudgetFixture(
        {
          storeId,
          patientId: 'pat-1',
          status: 'approved',
          finalValueCents: 999999,
        },
        'bud-approved',
      ),
      items: [],
    });
    budgetRepo.seed({
      budget: createBudgetFixture(
        {
          storeId,
          patientId: 'pat-1',
          status: 'expired',
          finalValueCents: 888888,
        },
        'bud-expired',
      ),
      items: [],
    });
    budgetRepo.seed({
      budget: createBudgetFixture(
        {
          storeId: 'store-2',
          patientId: 'pat-2',
          status: 'pending',
          finalValueCents: 777777,
        },
        'bud-other-store',
      ),
      items: [],
    });

    seedPatient(patientRepo, {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      birthDate: new Date('1990-07-17T00:00:00.000Z'),
    });
    seedPatient(patientRepo, {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
      birthDate: new Date('1985-08-01T00:00:00.000Z'),
    });
    seedPatient(patientRepo, {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
      birthDate: new Date('1992-08-17T00:00:00.000Z'),
    });
    seedPatient(patientRepo, {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
      status: 'inactive',
      birthDate: new Date('1990-07-20T00:00:00.000Z'),
    });
    seedPatient(patientRepo, {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5',
      birthDate: null,
    });
    seedPatient(patientRepo, {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6',
      storeId: 'store-2',
      birthDate: new Date('1990-07-18T00:00:00.000Z'),
    });

    const result = await useCase.execute({ storeId, now: today });

    expect(result).toEqual({
      overdueIncomeTotalCents: 178000,
      openRejectedBudgetsTotalCents: 150000,
      upcomingBirthdaysCount: 2,
    });
  });

  it('counts year-wrap birthdays within 30 days', async () => {
    const { patientRepo, useCase } = createUseCase();
    const lateDecember = new Date('2026-12-20T12:00:00.000Z');

    seedPatient(patientRepo, {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
      birthDate: new Date('1991-01-05T00:00:00.000Z'),
    });
    seedPatient(patientRepo, {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
      birthDate: new Date('1991-01-25T00:00:00.000Z'),
    });

    const result = await useCase.execute({ storeId, now: lateDecember });

    expect(result.upcomingBirthdaysCount).toBe(1);
  });

  it('returns zero when there are no overdue incomes, open/rejected budgets or birthdays', async () => {
    const { entryRepo, budgetRepo, useCase } = createUseCase();

    entryRepo.seed([
      FinancialEntry.create({
        storeId,
        type: 'income',
        source: 'manual',
        description: 'Futuro',
        valueCents: 10000,
        dueDate: new Date('2026-07-20T00:00:00.000Z'),
        status: 'pending',
      }),
    ]);

    budgetRepo.seed({
      budget: createBudgetFixture({
        storeId,
        patientId: 'pat-1',
        status: 'approved',
        finalValueCents: 50000,
      }),
      items: [],
    });

    const result = await useCase.execute({ storeId, now: today });

    expect(result).toEqual({
      overdueIncomeTotalCents: 0,
      openRejectedBudgetsTotalCents: 0,
      upcomingBirthdaysCount: 0,
    });
  });
});
