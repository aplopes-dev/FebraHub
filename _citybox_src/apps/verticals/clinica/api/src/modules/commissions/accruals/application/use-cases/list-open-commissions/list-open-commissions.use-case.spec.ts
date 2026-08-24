import { CommissionRule } from '../../../../rules/domain/entities/commission-rule.entity';
import { InMemoryCommissionRuleRepository } from '../../../../rules/tests/in-memory-commission-rule.repository';
import { InMemoryCommissionAccrualRepository } from '../../../tests/in-memory-commission-accrual.repository';
import { CreateCommissionAccrualUseCase } from '../create-commission-accrual/create-commission-accrual.use-case';
import { ListOpenCommissionsUseCase } from './list-open-commissions.use-case';
import { GetOpenCommissionDetailUseCase } from '../get-open-commission-detail/get-open-commission-detail.use-case';
import { CommissionMemberOpenNotFoundError } from '../../../domain/errors/commission-member-open-not-found.error';
import { PassthroughEnrichCommissionTreatmentNamesService } from '../../../tests/passthrough-enrich-commission-treatment-names.service';

const STORE_ID = '11111111-1111-4111-8111-111111111111';
const MEMBER_A = '22222222-2222-4222-8222-222222222222';
const MEMBER_B = '33333333-3333-4333-8333-333333333333';

describe('ListOpenCommissionsUseCase', () => {
  let accrualRepo: InMemoryCommissionAccrualRepository;
  let ruleRepo: InMemoryCommissionRuleRepository;
  let createAccrual: CreateCommissionAccrualUseCase;
  let listOpen: ListOpenCommissionsUseCase;
  let getDetail: GetOpenCommissionDetailUseCase;

  beforeEach(() => {
    accrualRepo = new InMemoryCommissionAccrualRepository();
    ruleRepo = new InMemoryCommissionRuleRepository();
    createAccrual = new CreateCommissionAccrualUseCase(accrualRepo);
    const enrich = new PassthroughEnrichCommissionTreatmentNamesService() as never;
    listOpen = new ListOpenCommissionsUseCase(accrualRepo, ruleRepo, enrich);
    getDetail = new GetOpenCommissionDetailUseCase(accrualRepo, ruleRepo, enrich);
  });

  it('aggregates open accruals by member into ruleGroups', async () => {
    await ruleRepo.replaceAll(STORE_ID, MEMBER_A, 'Dra. Ana', [
      CommissionRule.create({
        storeId: STORE_ID,
        memberId: MEMBER_A,
        memberName: 'Dra. Ana',
        paymentTrigger: 'debit_received',
        commissionType: 'percentage',
        percentageValue: 10,
      }),
    ]);

    await createAccrual.execute({
      storeId: STORE_ID,
      memberId: MEMBER_A,
      memberName: 'Dra. Ana',
      paymentTrigger: 'debit_received',
      planName: 'Particular',
      specialtyName: 'Cirurgia',
      treatmentName: 'Extração',
      patientName: 'Maria',
      paidValueCents: 15000,
      treatmentCostCents: 10000,
      commissionCents: 3000,
      accruedAt: '2026-07-10',
    });
    await createAccrual.execute({
      storeId: STORE_ID,
      memberId: MEMBER_A,
      memberName: 'Dra. Ana',
      paymentTrigger: 'debit_received',
      planName: 'Particular',
      specialtyName: 'Cirurgia',
      treatmentName: 'Extração',
      patientName: 'João',
      paidValueCents: 15000,
      treatmentCostCents: 10000,
      commissionCents: 2000,
      accruedAt: '2026-07-11',
    });

    const result = await listOpen.execute({
      storeId: STORE_ID,
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    });

    expect(result.total).toBe(1);
    expect(result.items[0]?.professionalId).toBe(MEMBER_A);
    expect(result.items[0]?.hasCommissionConfigured).toBe(true);
    expect(result.items[0]?.totalCents).toBe(5000);
    expect(result.items[0]?.ruleGroups).toHaveLength(1);
    expect(result.items[0]?.ruleGroups[0]?.rows).toHaveLength(2);
  });

  it('includes configured members with zero open accruals in period', async () => {
    await ruleRepo.replaceAll(STORE_ID, MEMBER_B, 'Dr. Pedro', [
      CommissionRule.create({
        storeId: STORE_ID,
        memberId: MEMBER_B,
        memberName: 'Dr. Pedro',
        paymentTrigger: 'treatment_completed',
        commissionType: 'percentage',
        percentageValue: 5,
      }),
    ]);

    const result = await listOpen.execute({ storeId: STORE_ID });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.professionalId).toBe(MEMBER_B);
    expect(result.items[0]?.totalCents).toBe(0);
    expect(result.items[0]?.hasCommissionConfigured).toBe(true);
  });

  it('filters by memberId / professionalId', async () => {
    await createAccrual.execute({
      storeId: STORE_ID,
      memberId: MEMBER_A,
      memberName: 'Dra. Ana',
      paymentTrigger: 'debit_received',
      treatmentName: 'A',
      patientName: 'P',
      paidValueCents: 1,
      treatmentCostCents: 1,
      commissionCents: 100,
      accruedAt: '2026-07-10',
    });
    await createAccrual.execute({
      storeId: STORE_ID,
      memberId: MEMBER_B,
      memberName: 'Dr. Pedro',
      paymentTrigger: 'debit_received',
      treatmentName: 'B',
      patientName: 'P',
      paidValueCents: 1,
      treatmentCostCents: 1,
      commissionCents: 200,
      accruedAt: '2026-07-10',
    });

    const result = await listOpen.execute({
      storeId: STORE_ID,
      memberId: MEMBER_B,
    });
    expect(result.total).toBe(1);
    expect(result.items[0]?.professionalId).toBe(MEMBER_B);
  });

  it('returns open detail for member', async () => {
    await createAccrual.execute({
      storeId: STORE_ID,
      memberId: MEMBER_A,
      memberName: 'Dra. Ana',
      paymentTrigger: 'budget_approved',
      treatmentName: 'Orçamento',
      patientName: 'Maria',
      paidValueCents: 10000,
      treatmentCostCents: 8000,
      commissionCents: 1000,
      accruedAt: '2026-07-15',
    });

    const detail = await getDetail.execute({
      storeId: STORE_ID,
      memberId: MEMBER_A,
    });
    expect(detail.totalCents).toBe(1000);
    expect(detail.ruleGroups[0]?.triggerLabel).toBe('Aprovação de orçamento');
  });

  it('throws NotFound when member has neither rules nor open accruals', async () => {
    await expect(
      getDetail.execute({ storeId: STORE_ID, memberId: MEMBER_A }),
    ).rejects.toBeInstanceOf(CommissionMemberOpenNotFoundError);
  });
});
