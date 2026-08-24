import { InMemoryPropertyRepository } from '../../../../properties/infrastructure/database/in-memory-property.repository';
import { InMemoryDealRepository } from '../../../../deals/infrastructure/database/in-memory-deal.repository';
import { seedDeal } from '../../../../deals/application/use-cases/shared/deal-test-fixtures';
import { InMemoryLeadRepository } from '../../../../leads/infrastructure/database/in-memory-lead.repository';
import { InMemoryTransactionRepository } from '../../../infrastructure/database/in-memory-transaction.repository';
import { InvalidTransactionStatusTransitionError } from '../../../domain/errors/invalid-transaction-status-transition.error';
import {
  makeRental,
  seedTransaction,
  TEST_STORE,
} from '../shared/transaction-test-fixtures';
import { UpdateTransactionStatusUseCase } from './update-transaction-status.use-case';

const PROPERTY_ID = 'prop-1';

async function seedProperty(
  repo: InMemoryPropertyRepository,
  status: 'available' | 'sold-out' | 'occupied' | 'reserved' = 'available',
  listingType: 'sale' | 'rent' = 'sale',
) {
  return repo.create({
    storeId: TEST_STORE,
    name: 'Casa Pontal',
    city: 'Ilhéus',
    state: 'BA',
    type: 'house',
    status,
    listingType,
    negotiable: true,
  });
}

describe('UpdateTransactionStatusUseCase', () => {
  let transactions: InMemoryTransactionRepository;
  let properties: InMemoryPropertyRepository;
  let deals: InMemoryDealRepository;
  let leads: InMemoryLeadRepository;
  let useCase: UpdateTransactionStatusUseCase;

  beforeEach(() => {
    transactions = new InMemoryTransactionRepository();
    properties = new InMemoryPropertyRepository();
    deals = new InMemoryDealRepository();
    leads = new InMemoryLeadRepository();
    useCase = new UpdateTransactionStatusUseCase(
      transactions,
      deals,
      properties,
      leads,
    );
  });

  it('marks sale as completed and locks property as sold-out', async () => {
    const property = await seedProperty(properties, 'reserved', 'sale');
    const tx = await seedTransaction(transactions, {
      propertyId: property.id,
      type: 'SALE',
      status: 'PROPOSAL',
    });

    const updated = await useCase.execute({
      storeId: TEST_STORE,
      id: tx.id,
      status: 'COMPLETED',
      actorName: 'Admin',
    });

    expect(updated.status).toBe('COMPLETED');
    expect(updated.activityLog.length).toBe(2);
    const prop = await properties.findById(TEST_STORE, property.id);
    expect(prop?.status).toBe('sold-out');
  });

  it('marks rental as completed and locks property as occupied', async () => {
    const property = await seedProperty(properties, 'reserved', 'rent');
    const tx = await seedTransaction(transactions, {
      propertyId: property.id,
      type: 'RENTAL',
      status: 'CONTRACT_SIGNED',
      rental: makeRental(),
    });

    await useCase.execute({
      storeId: TEST_STORE,
      id: tx.id,
      status: 'COMPLETED',
      actorName: 'Admin',
    });

    const prop = await properties.findById(TEST_STORE, property.id);
    expect(prop?.status).toBe('occupied');
  });

  it('reopens property on cancel when no other active transaction exists', async () => {
    const property = await seedProperty(properties, 'sold-out', 'sale');
    const tx = await seedTransaction(transactions, {
      propertyId: property.id,
      status: 'COMPLETED',
    });

    await useCase.execute({
      storeId: TEST_STORE,
      id: tx.id,
      status: 'CANCELLED',
      actorName: 'Admin',
    });

    const prop = await properties.findById(TEST_STORE, property.id);
    expect(prop?.status).toBe('available');
  });

  it('does not reopen property when another active transaction exists', async () => {
    const property = await seedProperty(properties, 'sold-out', 'sale');
    const first = await seedTransaction(transactions, {
      propertyId: property.id,
      status: 'COMPLETED',
      title: 'Deal 1',
    });
    await seedTransaction(transactions, {
      propertyId: property.id,
      status: 'PROPOSAL',
      title: 'Deal 2',
    });

    await useCase.execute({
      storeId: TEST_STORE,
      id: first.id,
      status: 'CANCELLED',
      actorName: 'Admin',
    });

    const prop = await properties.findById(TEST_STORE, property.id);
    expect(prop?.status).toBe('reserved');
  });

  it('rejects cancel → completed', async () => {
    const tx = await seedTransaction(transactions, {
      propertyId: PROPERTY_ID,
      status: 'CANCELLED',
    });

    await expect(
      useCase.execute({
        storeId: TEST_STORE,
        id: tx.id,
        status: 'COMPLETED',
        actorName: 'Admin',
      }),
    ).rejects.toBeInstanceOf(InvalidTransactionStatusTransitionError);
  });

  it('advances linked deal to payment_confirmed on COMPLETED', async () => {
    const property = await seedProperty(properties, 'available', 'sale');
    const lead = await leads.create({
      storeId: TEST_STORE,
      name: 'Mariana Souza',
      status: 'negotiating',
      leadSource: 'website',
      interestedPropertyType: 'house',
      purpose: 'buying',
    });
    const deal = await seedDeal(deals, {
      leadId: lead.id,
      propertyId: property.id,
      stage: 'contract_signed',
    });
    const tx = await seedTransaction(transactions, {
      propertyId: property.id,
      leadId: lead.id,
      dealId: deal.id,
      status: 'CONTRACT_SIGNED',
    });

    await useCase.execute({
      storeId: TEST_STORE,
      id: tx.id,
      status: 'COMPLETED',
      actorName: 'Admin',
    });

    const updatedDeal = await deals.findById(TEST_STORE, deal.id);
    expect(updatedDeal?.stage).toBe('payment_confirmed');
    expect(updatedDeal?.status).toBe('active');

    const updatedLead = await leads.findById(TEST_STORE, lead.id);
    expect(updatedLead?.status).toBe('negotiating');
  });

  it('advances deal via leadId when transaction has no dealId', async () => {
    const property = await seedProperty(properties, 'reserved', 'sale');
    const lead = await leads.create({
      storeId: TEST_STORE,
      name: 'Mariana Souza',
      status: 'negotiating',
      leadSource: 'website',
      interestedPropertyType: 'house',
      purpose: 'buying',
    });
    const deal = await seedDeal(deals, {
      leadId: lead.id,
      propertyId: property.id,
      stage: 'contract_signed',
    });
    const tx = await seedTransaction(transactions, {
      propertyId: property.id,
      leadId: lead.id,
      dealId: null,
      status: 'CONTRACT_SIGNED',
    });

    await useCase.execute({
      storeId: TEST_STORE,
      id: tx.id,
      status: 'COMPLETED',
      actorName: 'Admin',
    });

    const updatedDeal = await deals.findById(TEST_STORE, deal.id);
    expect(updatedDeal?.stage).toBe('payment_confirmed');
  });

  it('locks property from deal when transaction has no propertyId', async () => {
    const property = await seedProperty(properties, 'reserved', 'sale');
    const deal = await seedDeal(deals, {
      propertyId: property.id,
      stage: 'contract_signed',
    });
    const tx = await seedTransaction(transactions, {
      propertyId: null,
      dealId: deal.id,
      status: 'CONTRACT_SIGNED',
    });

    await useCase.execute({
      storeId: TEST_STORE,
      id: tx.id,
      status: 'COMPLETED',
      actorName: 'Admin',
    });

    const updatedProperty = await properties.findById(TEST_STORE, property.id);
    expect(updatedProperty?.status).toBe('sold-out');
  });

  it('reverts deal from payment_confirmed to contract_signed on CANCELLED', async () => {
    const property = await seedProperty(properties, 'available', 'sale');
    const deal = await seedDeal(deals, {
      propertyId: property.id,
      stage: 'payment_confirmed',
    });
    const tx = await seedTransaction(transactions, {
      propertyId: property.id,
      dealId: deal.id,
      status: 'COMPLETED',
    });

    await useCase.execute({
      storeId: TEST_STORE,
      id: tx.id,
      status: 'CANCELLED',
      actorName: 'Admin',
    });

    const updatedDeal = await deals.findById(TEST_STORE, deal.id);
    expect(updatedDeal?.stage).toBe('contract_signed');
    expect(updatedDeal?.status).toBe('active');
  });

  it('reopens lead and reverts won deal on CANCELLED after handover', async () => {
    const property = await seedProperty(properties, 'sold-out', 'sale');
    const lead = await leads.create({
      storeId: TEST_STORE,
      name: 'Mariana Souza',
      status: 'closed-won',
      leadSource: 'website',
      interestedPropertyType: 'house',
      purpose: 'buying',
    });
    const deal = await seedDeal(deals, {
      leadId: lead.id,
      propertyId: property.id,
      stage: 'handover',
      status: 'won',
    });
    const tx = await seedTransaction(transactions, {
      propertyId: property.id,
      leadId: lead.id,
      dealId: deal.id,
      status: 'COMPLETED',
    });

    await useCase.execute({
      storeId: TEST_STORE,
      id: tx.id,
      status: 'CANCELLED',
      actorName: 'Admin',
    });

    const updatedDeal = await deals.findById(TEST_STORE, deal.id);
    expect(updatedDeal?.stage).toBe('contract_signed');
    expect(updatedDeal?.status).toBe('active');

    const updatedLead = await leads.findById(TEST_STORE, lead.id);
    expect(updatedLead?.status).toBe('negotiating');

    const updatedProperty = await properties.findById(TEST_STORE, property.id);
    expect(updatedProperty?.status).toBe('available');
  });
});
