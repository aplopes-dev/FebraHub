import { DealNotActiveError } from '../../../domain/errors/deal-not-active.error';
import { DealNotFoundError } from '../../../domain/errors/deal-not-found.error';
import { DealPropertyRequiredForStageError } from '../../../domain/errors/deal-property-required-for-stage.error';
import { InMemoryDealRepository } from '../../../infrastructure/database/in-memory-deal.repository';
import { InMemoryLeadRepository } from '../../../../leads/infrastructure/database/in-memory-lead.repository';
import { InMemoryPropertyRepository } from '../../../../properties/infrastructure/database/in-memory-property.repository';
import { InMemoryTransactionRepository } from '../../../../transactions/infrastructure/database/in-memory-transaction.repository';
import { seedTransaction } from '../../../../transactions/application/use-cases/shared/transaction-test-fixtures';
import { seedDeal, TEST_STORE } from '../shared/deal-test-fixtures';
import { UpdateDealStageUseCase } from './update-deal-stage.use-case';

describe('UpdateDealStageUseCase', () => {
  let deals: InMemoryDealRepository;
  let transactions: InMemoryTransactionRepository;
  let properties: InMemoryPropertyRepository;
  let leads: InMemoryLeadRepository;
  let useCase: UpdateDealStageUseCase;

  beforeEach(() => {
    deals = new InMemoryDealRepository();
    transactions = new InMemoryTransactionRepository();
    properties = new InMemoryPropertyRepository();
    leads = new InMemoryLeadRepository();
    useCase = new UpdateDealStageUseCase(
      deals,
      transactions,
      properties,
      leads,
    );
  });

  it('advances stage on active deal', async () => {
    const deal = await seedDeal(deals, {
      stage: 'awaiting_property',
      propertyId: 'prop-1',
    });

    const updated = await useCase.execute({
      storeId: TEST_STORE,
      id: deal.id,
      stage: 'property_selected',
    });

    expect(updated.stage).toBe('property_selected');
    expect(updated.status).toBe('active');
  });

  it('allows property_selected when only legacy propertyName is set', async () => {
    const deal = await seedDeal(deals, {
      stage: 'awaiting_property',
      propertyId: null,
      propertyName: 'Cobertura Jardim',
    });

    const updated = await useCase.execute({
      storeId: TEST_STORE,
      id: deal.id,
      stage: 'property_selected',
    });

    expect(updated.stage).toBe('property_selected');
  });

  it('throws when moving to property_selected without linked property', async () => {
    const deal = await seedDeal(deals, {
      stage: 'awaiting_property',
      propertyId: null,
    });

    await expect(
      useCase.execute({
        storeId: TEST_STORE,
        id: deal.id,
        stage: 'property_selected',
      }),
    ).rejects.toBeInstanceOf(DealPropertyRequiredForStageError);
  });

  it('advances from property_selected to contract_sent', async () => {
    const property = await properties.create({
      storeId: TEST_STORE,
      name: 'Casa',
      type: 'house',
      status: 'reserved',
      listingType: 'sale',
    });
    const deal = await seedDeal(deals, {
      stage: 'property_selected',
      propertyId: property.id,
    });

    const updated = await useCase.execute({
      storeId: TEST_STORE,
      id: deal.id,
      stage: 'contract_sent',
    });

    expect(updated.stage).toBe('contract_sent');
    expect(updated.status).toBe('active');
    expect((await properties.findById(TEST_STORE, property.id))?.status).toBe(
      'occupied',
    );
  });

  it('reverses property to reserved when moved back to property_selected', async () => {
    const property = await properties.create({
      storeId: TEST_STORE,
      name: 'Casa',
      type: 'house',
      status: 'occupied',
      listingType: 'sale',
    });
    const deal = await seedDeal(deals, {
      stage: 'contract_sent',
      propertyId: property.id,
    });

    const updated = await useCase.execute({
      storeId: TEST_STORE,
      id: deal.id,
      stage: 'property_selected',
    });

    expect(updated.stage).toBe('property_selected');
    expect((await properties.findById(TEST_STORE, property.id))?.status).toBe(
      'reserved',
    );
  });

  it('unlinks property from deal and lead when moved back to awaiting_property', async () => {
    const property = await properties.create({
      storeId: TEST_STORE,
      name: 'Casa Pontal',
      city: 'Ilhéus',
      state: 'BA',
      type: 'house',
      status: 'available',
      listingType: 'sale',
      negotiable: true,
    });
    const lead = await leads.create({
      storeId: TEST_STORE,
      name: 'Mariana Souza',
      status: 'negotiating',
      leadSource: 'website',
      interestedPropertyType: 'house',
      purpose: 'buying',
      matchedProperties: [{ id: property.id, name: property.name }],
      propertyName: property.name,
    });
    const deal = await seedDeal(deals, {
      leadId: lead.id,
      propertyId: property.id,
      propertyName: property.name,
      stage: 'property_selected',
    });
    await properties.updateAvailability(TEST_STORE, property.id, 'reserved');
    await seedTransaction(transactions, {
      propertyId: property.id,
      leadId: lead.id,
      dealId: deal.id,
      status: 'PROPOSAL',
    });

    const updated = await useCase.execute({
      storeId: TEST_STORE,
      id: deal.id,
      stage: 'awaiting_property',
    });

    expect(updated.stage).toBe('awaiting_property');
    expect(updated.propertyId).toBeNull();
    expect(updated.propertyName).toBe('');

    const updatedLead = await leads.findById(TEST_STORE, lead.id);
    expect(updatedLead?.matchedProperties).toEqual([]);
    expect(updatedLead?.propertyName).toBeNull();

    const tx = await transactions.findByDealId(TEST_STORE, deal.id);
    expect(tx?.status).toBe('CANCELLED');
    expect((await properties.findById(TEST_STORE, property.id))?.status).toBe(
      'available',
    );
  });

  it('reopens reserved property even when an old COMPLETED tx exists on it', async () => {
    const property = await properties.create({
      storeId: TEST_STORE,
      name: 'Casa Antiga',
      city: 'Ilhéus',
      state: 'BA',
      type: 'house',
      status: 'available',
      listingType: 'sale',
      negotiable: true,
    });
    const lead = await leads.create({
      storeId: TEST_STORE,
      name: 'João',
      status: 'negotiating',
      leadSource: 'website',
      interestedPropertyType: 'house',
      purpose: 'buying',
      matchedProperties: [{ id: property.id, name: property.name }],
    });
    const deal = await seedDeal(deals, {
      leadId: lead.id,
      propertyId: property.id,
      propertyName: property.name,
      stage: 'contract_signed',
    });
    await seedTransaction(transactions, {
      propertyId: property.id,
      leadId: 'other-lead',
      dealId: null,
      status: 'COMPLETED',
      title: 'Venda antiga',
    });
    await properties.updateAvailability(TEST_STORE, property.id, 'reserved');
    await seedTransaction(transactions, {
      propertyId: property.id,
      leadId: lead.id,
      dealId: deal.id,
      status: 'PROPOSAL',
      title: 'Proposta atual',
    });

    await useCase.execute({
      storeId: TEST_STORE,
      id: deal.id,
      stage: 'awaiting_property',
    });

    expect((await properties.findById(TEST_STORE, property.id))?.status).toBe(
      'available',
    );
  });

  it('marks deal as won when stage is handover', async () => {
    const deal = await seedDeal(deals, { stage: 'payment_confirmed' });

    const updated = await useCase.execute({
      storeId: TEST_STORE,
      id: deal.id,
      stage: 'handover',
    });

    expect(updated.stage).toBe('handover');
    expect(updated.status).toBe('won');
  });

  it('closes lead and locks property on handover when transaction is linked', async () => {
    const property = await properties.create({
      storeId: TEST_STORE,
      name: 'Casa Pontal',
      city: 'Ilhéus',
      state: 'BA',
      type: 'house',
      status: 'available',
      listingType: 'sale',
      negotiable: true,
    });
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
      stage: 'payment_confirmed',
    });
    await seedTransaction(transactions, {
      propertyId: property.id,
      leadId: lead.id,
      dealId: deal.id,
      type: 'SALE',
      status: 'COMPLETED',
    });

    await useCase.execute({
      storeId: TEST_STORE,
      id: deal.id,
      stage: 'handover',
    });

    const updatedLead = await leads.findById(TEST_STORE, lead.id);
    expect(updatedLead?.status).toBe('closed-won');

    const updatedProperty = await properties.findById(TEST_STORE, property.id);
    expect(updatedProperty?.status).toBe('sold-out');
  });

  it('locks property on handover even without linked transaction (deal owns property)', async () => {
    const property = await properties.create({
      storeId: TEST_STORE,
      name: 'Cobertura Jardim',
      city: 'Ilhéus',
      state: 'BA',
      type: 'apartment',
      status: 'available',
      listingType: 'sale',
      negotiable: true,
    });
    const lead = await leads.create({
      storeId: TEST_STORE,
      name: 'Ana Beatriz',
      status: 'negotiating',
      leadSource: 'website',
      interestedPropertyType: 'apartment',
      purpose: 'buying',
    });
    const deal = await seedDeal(deals, {
      leadId: lead.id,
      propertyId: property.id,
      stage: 'payment_confirmed',
      type: 'SALE',
    });

    await useCase.execute({
      storeId: TEST_STORE,
      id: deal.id,
      stage: 'handover',
    });

    const updatedProperty = await properties.findById(TEST_STORE, property.id);
    expect(updatedProperty?.status).toBe('sold-out');

    const updatedLead = await leads.findById(TEST_STORE, lead.id);
    expect(updatedLead?.status).toBe('closed-won');
  });

  it('locks property as sold-out on handover when deal type is null (defaults to SALE)', async () => {
    const property = await properties.create({
      storeId: TEST_STORE,
      name: 'Studio Praia',
      city: 'Ilhéus',
      state: 'BA',
      type: 'apartment',
      status: 'available',
      listingType: 'sale',
      negotiable: true,
    });
    const deal = await seedDeal(deals, {
      propertyId: property.id,
      stage: 'payment_confirmed',
    });

    await useCase.execute({
      storeId: TEST_STORE,
      id: deal.id,
      stage: 'handover',
    });

    const updatedProperty = await properties.findById(TEST_STORE, property.id);
    expect(updatedProperty?.status).toBe('sold-out');
  });

  it('locks property as occupied on handover for rental deals without transaction', async () => {
    const property = await properties.create({
      storeId: TEST_STORE,
      name: 'Casa Aluguel',
      city: 'Ilhéus',
      state: 'BA',
      type: 'house',
      status: 'available',
      listingType: 'rent',
      negotiable: true,
    });
    const deal = await seedDeal(deals, {
      propertyId: property.id,
      stage: 'payment_confirmed',
      type: 'RENTAL',
    });

    await useCase.execute({
      storeId: TEST_STORE,
      id: deal.id,
      stage: 'handover',
    });

    const updatedProperty = await properties.findById(TEST_STORE, property.id);
    expect(updatedProperty?.status).toBe('occupied');
  });

  it('throws when deal is not found', async () => {
    await expect(
      useCase.execute({
        storeId: TEST_STORE,
        id: 'missing',
        stage: 'contract_sent',
      }),
    ).rejects.toBeInstanceOf(DealNotFoundError);
  });

  it('throws when deal is not active', async () => {
    const deal = await seedDeal(deals, { status: 'won' });

    await expect(
      useCase.execute({
        storeId: TEST_STORE,
        id: deal.id,
        stage: 'contract_sent',
      }),
    ).rejects.toBeInstanceOf(DealNotActiveError);
  });

  it('isolates deals by store', async () => {
    const deal = await seedDeal(deals);

    await expect(
      useCase.execute({
        storeId: 'other-store',
        id: deal.id,
        stage: 'contract_sent',
      }),
    ).rejects.toBeInstanceOf(DealNotFoundError);
  });
});
