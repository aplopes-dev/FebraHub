import { CreateCommissionAccrualUseCase } from './create-commission-accrual.use-case';
import { InMemoryCommissionAccrualRepository } from '../../../tests/in-memory-commission-accrual.repository';

const STORE_ID = '11111111-1111-4111-8111-111111111111';
const MEMBER_ID = '22222222-2222-4222-8222-222222222222';

describe('CreateCommissionAccrualUseCase', () => {
  let repository: InMemoryCommissionAccrualRepository;
  let useCase: CreateCommissionAccrualUseCase;

  beforeEach(() => {
    repository = new InMemoryCommissionAccrualRepository();
    useCase = new CreateCommissionAccrualUseCase(repository);
  });

  it('creates an open accrual with denormalized trigger label', async () => {
    const accrual = await useCase.execute({
      storeId: STORE_ID,
      memberId: MEMBER_ID,
      memberName: 'Dra. Ana',
      paymentTrigger: 'debit_received',
      planName: 'Particular',
      specialtyName: 'Cirurgia',
      treatmentName: 'Extração',
      patientName: 'Maria',
      paidValueCents: 15000,
      treatmentCostCents: 10000,
      installment: '1/2',
      commissionCents: 3000,
      accruedAt: '2026-07-10',
      sourceFinancialEntryId: '33333333-3333-4333-8333-333333333333',
    });

    expect(accrual.status).toBe('open');
    expect(accrual.triggerLabel).toBe('Débito recebido do paciente');
    expect(accrual.commissionCents).toBe(3000);
    expect(repository.getAll()).toHaveLength(1);
  });

  it('maps treatment_completed and budget_approved labels', async () => {
    const completed = await useCase.execute({
      storeId: STORE_ID,
      memberId: MEMBER_ID,
      memberName: 'Dra. Ana',
      paymentTrigger: 'treatment_completed',
      treatmentName: 'Canal',
      patientName: 'João',
      paidValueCents: 10000,
      treatmentCostCents: 8000,
      commissionCents: 1000,
      accruedAt: '2026-07-11',
    });
    const approved = await useCase.execute({
      storeId: STORE_ID,
      memberId: MEMBER_ID,
      memberName: 'Dra. Ana',
      paymentTrigger: 'budget_approved',
      treatmentName: 'Orçamento',
      patientName: 'João',
      paidValueCents: 50000,
      treatmentCostCents: 40000,
      commissionCents: 5000,
      accruedAt: '2026-07-12',
    });

    expect(completed.triggerLabel).toBe('Procedimento finalizado');
    expect(approved.triggerLabel).toBe('Aprovação de orçamento');
  });
});
