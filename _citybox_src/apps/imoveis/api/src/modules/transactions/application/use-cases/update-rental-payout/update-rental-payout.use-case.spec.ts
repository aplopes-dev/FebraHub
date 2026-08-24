import { InMemoryDealRepository } from '../../../../deals/infrastructure/database/in-memory-deal.repository';
import { seedDeal } from '../../../../deals/application/use-cases/shared/deal-test-fixtures';
import { InMemoryPropertyRepository } from '../../../../properties/infrastructure/database/in-memory-property.repository';
import { TransactionNotFoundError } from '../../../domain/errors/transaction-not-found.error';
import { TransactionRentalMissingError } from '../../../domain/errors/transaction-rental-missing.error';
import { InMemoryTransactionRepository } from '../../../infrastructure/database/in-memory-transaction.repository';
import { todayDateOnly } from '../../policies/transaction-date.policy';
import {
  makeRental,
  seedTransaction,
  TEST_STORE,
} from '../shared/transaction-test-fixtures';
import { UpdateRentalPayoutUseCase } from './update-rental-payout.use-case';

describe('UpdateRentalPayoutUseCase', () => {
  let repo: InMemoryTransactionRepository;
  let deals: InMemoryDealRepository;
  let properties: InMemoryPropertyRepository;
  let useCase: UpdateRentalPayoutUseCase;

  beforeEach(() => {
    repo = new InMemoryTransactionRepository();
    deals = new InMemoryDealRepository();
    properties = new InMemoryPropertyRepository();
    useCase = new UpdateRentalPayoutUseCase(repo, deals, properties);
  });

  it('stamps paidAt when the tenant pays', async () => {
    const created = await seedTransaction(repo, {
      type: 'RENTAL',
      rental: makeRental(),
    });

    const updated = await useCase.execute({
      storeId: TEST_STORE,
      id: created.id,
      status: 'PAID_BY_TENANT',
      actorName: 'Ana Helena',
    });

    expect(updated.rental?.payoutStatus).toBe('PAID_BY_TENANT');
    expect(updated.rental?.paidAt).toBe(todayDateOnly());
    expect(updated.rental?.payoutAt).toBeUndefined();
    expect(updated.activityLog).toHaveLength(2);
  });

  it('advances linked deal to payment_confirmed when tenant pays', async () => {
    const property = await properties.create({
      storeId: TEST_STORE,
      name: 'Apto Centro',
      city: 'Ilhéus',
      state: 'BA',
      type: 'apartment',
      status: 'reserved',
      listingType: 'rent',
      negotiable: true,
    });
    const deal = await seedDeal(deals, {
      stage: 'contract_signed',
      propertyId: property.id,
    });
    const created = await seedTransaction(repo, {
      type: 'RENTAL',
      propertyId: property.id,
      dealId: deal.id,
      rental: makeRental(),
    });

    await useCase.execute({
      storeId: TEST_STORE,
      id: created.id,
      status: 'PAID_BY_TENANT',
      actorName: 'Ana Helena',
    });

    const updatedDeal = await deals.findById(TEST_STORE, deal.id);
    expect(updatedDeal?.stage).toBe('payment_confirmed');
    expect(updatedDeal?.status).toBe('active');

    const updatedProperty = await properties.findById(TEST_STORE, property.id);
    expect(updatedProperty?.status).toBe('occupied');
  });

  it('stamps payoutAt when the landlord is paid and keeps paidAt', async () => {
    const created = await seedTransaction(repo, {
      type: 'RENTAL',
      rental: makeRental({
        payoutStatus: 'READY_FOR_PAYOUT',
        paidAt: '2026-07-05',
      }),
    });

    const updated = await useCase.execute({
      storeId: TEST_STORE,
      id: created.id,
      status: 'PAID_TO_LANDLORD',
      actorName: 'Ana Helena',
    });

    expect(updated.rental?.paidAt).toBe('2026-07-05');
    expect(updated.rental?.payoutAt).toBe(todayDateOnly());
  });

  it('does not stamp anything when moving back to awaiting', async () => {
    const created = await seedTransaction(repo, {
      type: 'RENTAL',
      rental: makeRental(),
    });

    const updated = await useCase.execute({
      storeId: TEST_STORE,
      id: created.id,
      status: 'READY_FOR_PAYOUT',
      actorName: 'Ana Helena',
    });

    expect(updated.rental?.paidAt).toBeUndefined();
    expect(updated.rental?.payoutAt).toBeUndefined();
  });

  it('rejects transactions without a rental config', async () => {
    const created = await seedTransaction(repo, { type: 'SALE' });

    await expect(
      useCase.execute({
        storeId: TEST_STORE,
        id: created.id,
        status: 'PAID_BY_TENANT',
        actorName: 'Ana Helena',
      }),
    ).rejects.toBeInstanceOf(TransactionRentalMissingError);
  });

  it('rejects unknown transactions', async () => {
    await expect(
      useCase.execute({
        storeId: TEST_STORE,
        id: 'missing',
        status: 'PAID_BY_TENANT',
        actorName: 'Ana Helena',
      }),
    ).rejects.toBeInstanceOf(TransactionNotFoundError);
  });
});
