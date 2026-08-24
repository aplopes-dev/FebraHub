import { FinancialAccount } from '../../../../../financial/accounts/domain/entities/financial-account.entity';
import { InMemoryFinancialAccountRepository } from '../../../../../financial/accounts/tests/in-memory-financial-account.repository';
import { InMemoryFinancialEntryRepository } from '../../../../../financial/entries/tests/in-memory-financial-entry.repository';
import { InMemoryCommissionAccrualRepository } from '../../../../accruals/tests/in-memory-commission-accrual.repository';
import { CreateCommissionAccrualUseCase } from '../../../../accruals/application/use-cases/create-commission-accrual/create-commission-accrual.use-case';
import { InMemoryCommissionPaymentRepository } from '../../../tests/in-memory-commission-payment.repository';
import { CreateCommissionPaymentUseCase } from './create-commission-payment.use-case';
import { ListCommissionHistoryUseCase } from '../list-commission-history/list-commission-history.use-case';
import { GetCommissionPaymentDetailUseCase } from '../get-commission-payment-detail/get-commission-payment-detail.use-case';
import { CommissionAccrualAlreadyPaidError } from '../../../../accruals/domain/errors/commission-accrual-already-paid.error';
import { CommissionPaymentAccrualsMismatchError } from '../../../domain/errors/commission-payment-accruals-mismatch.error';
import { PassthroughEnrichCommissionTreatmentNamesService } from '../../../../accruals/tests/passthrough-enrich-commission-treatment-names.service';

const STORE_ID = '11111111-1111-4111-8111-111111111111';
const MEMBER_ID = '22222222-2222-4222-8222-222222222222';
const ACCOUNT_ID = '44444444-4444-4444-8444-444444444444';

describe('CreateCommissionPaymentUseCase', () => {
  let accrualRepo: InMemoryCommissionAccrualRepository;
  let paymentRepo: InMemoryCommissionPaymentRepository;
  let entryRepo: InMemoryFinancialEntryRepository;
  let accountRepo: InMemoryFinancialAccountRepository;
  let createAccrual: CreateCommissionAccrualUseCase;
  let createPayment: CreateCommissionPaymentUseCase;
  let listHistory: ListCommissionHistoryUseCase;
  let getDetail: GetCommissionPaymentDetailUseCase;

  beforeEach(async () => {
    accrualRepo = new InMemoryCommissionAccrualRepository();
    paymentRepo = new InMemoryCommissionPaymentRepository();
    paymentRepo.bindAccruals({
      getAll: () => accrualRepo.getAll(),
      markPaid: (storeId, ids) => accrualRepo.markPaid(storeId, ids),
    });
    entryRepo = new InMemoryFinancialEntryRepository();
    accountRepo = new InMemoryFinancialAccountRepository();
    accountRepo.seed([
      FinancialAccount.create(
        { storeId: STORE_ID, name: 'Caixa' },
        ACCOUNT_ID,
      ),
    ]);
    createAccrual = new CreateCommissionAccrualUseCase(accrualRepo);
    createPayment = new CreateCommissionPaymentUseCase(
      accrualRepo,
      paymentRepo,
      entryRepo,
      accountRepo,
    );
    const enrich = new PassthroughEnrichCommissionTreatmentNamesService() as never;
    listHistory = new ListCommissionHistoryUseCase(paymentRepo, enrich);
    getDetail = new GetCommissionPaymentDetailUseCase(paymentRepo, enrich);
  });

  it('marks accruals paid, creates payment items and expense entry', async () => {
    const a1 = await createAccrual.execute({
      storeId: STORE_ID,
      memberId: MEMBER_ID,
      memberName: 'Dra. Ana',
      paymentTrigger: 'debit_received',
      treatmentName: 'Extração',
      patientName: 'Maria',
      paidValueCents: 15000,
      treatmentCostCents: 10000,
      commissionCents: 3000,
      accruedAt: '2026-07-10',
    });
    const a2 = await createAccrual.execute({
      storeId: STORE_ID,
      memberId: MEMBER_ID,
      memberName: 'Dra. Ana',
      paymentTrigger: 'debit_received',
      treatmentName: 'Extração',
      patientName: 'João',
      paidValueCents: 15000,
      treatmentCostCents: 10000,
      commissionCents: 2000,
      accruedAt: '2026-07-11',
    });

    const payment = await createPayment.execute({
      storeId: STORE_ID,
      memberId: MEMBER_ID,
      accrualIds: [a1.id, a2.id],
      description: 'Comissão Dra. Ana',
      paymentDate: '2026-07-15',
      accountId: ACCOUNT_ID,
      paymentMethod: 'pix',
      discountCents: 500,
    });

    expect(payment.grossCents).toBe(5000);
    expect(payment.discountCents).toBe(500);
    expect(payment.netCents).toBe(4500);
    expect(payment.expenseEntryId).toBeTruthy();

    expect(accrualRepo.getAll().every((a) => a.status === 'paid')).toBe(true);

    const expense = await entryRepo.findById(
      STORE_ID,
      payment.expenseEntryId!,
    );
    expect(expense?.entry.type).toBe('expense');
    expect(expense?.entry.status).toBe('paid');
    expect(expense?.entry.source).toBe('manual');
    expect(expense?.entry.valueCents).toBe(4500);

    const history = await listHistory.execute({ storeId: STORE_ID });
    expect(history.total).toBe(1);
    expect(history.items[0]?.paidValueCents).toBe(4500);
    expect(history.items[0]?.discountCents).toBe(500);
    expect(history.items[0]?.ruleGroups[0]?.rows).toHaveLength(2);

    const detail = await getDetail.execute({
      storeId: STORE_ID,
      memberId: MEMBER_ID,
    });
    expect(detail.professionalId).toBe(MEMBER_ID);
    expect(detail.totalCents).toBe(5000);
    expect(detail.paidValueCents).toBe(4500);
    expect(detail.discountCents).toBe(500);
  });

  it('rejects payment when accrual already paid', async () => {
    const accrual = await createAccrual.execute({
      storeId: STORE_ID,
      memberId: MEMBER_ID,
      memberName: 'Dra. Ana',
      paymentTrigger: 'treatment_completed',
      treatmentName: 'Canal',
      patientName: 'Maria',
      paidValueCents: 10000,
      treatmentCostCents: 8000,
      commissionCents: 1000,
      accruedAt: '2026-07-10',
    });

    await createPayment.execute({
      storeId: STORE_ID,
      memberId: MEMBER_ID,
      accrualIds: [accrual.id],
      description: 'Comissão',
      paymentDate: '2026-07-15',
      accountId: ACCOUNT_ID,
      paymentMethod: 'pix',
    });

    await expect(
      createPayment.execute({
        storeId: STORE_ID,
        memberId: MEMBER_ID,
        accrualIds: [accrual.id],
        description: 'Comissão 2',
        paymentDate: '2026-07-16',
        accountId: ACCOUNT_ID,
        paymentMethod: 'pix',
      }),
    ).rejects.toBeInstanceOf(CommissionAccrualAlreadyPaidError);
  });

  it('rejects when accrual ids do not match member open set', async () => {
    await expect(
      createPayment.execute({
        storeId: STORE_ID,
        memberId: MEMBER_ID,
        accrualIds: ['55555555-5555-4555-8555-555555555555'],
        description: 'Comissão',
        paymentDate: '2026-07-15',
        accountId: ACCOUNT_ID,
        paymentMethod: 'pix',
      }),
    ).rejects.toBeInstanceOf(CommissionPaymentAccrualsMismatchError);
  });
});
