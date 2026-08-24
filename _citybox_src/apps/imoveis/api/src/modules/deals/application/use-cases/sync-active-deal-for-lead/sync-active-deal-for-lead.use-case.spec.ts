import { InMemoryLeadRepository } from '../../../../leads/infrastructure/database/in-memory-lead.repository';
import { InMemoryPropertyRepository } from '../../../../properties/infrastructure/database/in-memory-property.repository';
import { seedTransaction } from '../../../../transactions/application/use-cases/shared/transaction-test-fixtures';
import { InMemoryTransactionRepository } from '../../../../transactions/infrastructure/database/in-memory-transaction.repository';
import { InMemoryDealRepository } from '../../../infrastructure/database/in-memory-deal.repository';
import { SyncActiveDealForLeadUseCase } from './sync-active-deal-for-lead.use-case';

const STORE = 'store-1';

const BASE_LEAD = {
  storeId: STORE,
  status: 'new' as const,
  leadSource: 'website' as const,
  interestedPropertyType: 'house' as const,
  purpose: 'buying' as const,
};

describe('SyncActiveDealForLeadUseCase', () => {
  let leads: InMemoryLeadRepository;
  let deals: InMemoryDealRepository;
  let properties: InMemoryPropertyRepository;
  let transactions: InMemoryTransactionRepository;
  let useCase: SyncActiveDealForLeadUseCase;

  beforeEach(() => {
    leads = new InMemoryLeadRepository();
    deals = new InMemoryDealRepository();
    properties = new InMemoryPropertyRepository();
    transactions = new InMemoryTransactionRepository();
    useCase = new SyncActiveDealForLeadUseCase(deals, properties, transactions);
  });

  it('creates active deal at awaiting_property when lead has no property', async () => {
    const lead = await leads.create({ ...BASE_LEAD, name: 'Maria' });

    const deal = await useCase.execute(lead);

    expect(deal).not.toBeNull();
    expect(deal!.stage).toBe('awaiting_property');
    expect(deal!.leadId).toBe(lead.id);
  });

  it('creates deal at property_selected when lead has matched property', async () => {
    const property = await properties.create({
      storeId: STORE,
      name: 'Casa Pontal',
      type: 'house',
      status: 'available',
      listingType: 'sale',
    });
    const lead = await leads.create({
      ...BASE_LEAD,
      name: 'João',
      matchedProperties: [{ id: property.id, name: property.name }],
    });

    const deal = await useCase.execute(lead);

    expect(deal!.stage).toBe('property_selected');
    expect(deal!.propertyId).toBe(property.id);
    expect(deal!.propertyName).toBe('Casa Pontal');
    expect((await properties.findById(STORE, property.id))?.status).toBe(
      'reserved',
    );
  });

  it('uses legacy propertyName when matchedProperties is empty', async () => {
    const lead = await leads.create({
      ...BASE_LEAD,
      name: 'Rafael',
      propertyName: 'Casa Pontal',
    });

    const deal = await useCase.execute(lead);

    expect(deal!.stage).toBe('property_selected');
    expect(deal!.propertyName).toBe('Casa Pontal');
  });

  it('updates early-stage deal when property is linked later', async () => {
    const lead = await leads.create({ ...BASE_LEAD, name: 'Ana' });
    await useCase.execute(lead);

    const updatedLead = await leads.update(STORE, lead.id, {
      ...BASE_LEAD,
      name: 'Ana',
      matchedProperties: [{ id: 'prop-2', name: 'Apto Centro' }],
    });
    expect(updatedLead).not.toBeNull();

    const deal = await useCase.execute(updatedLead!);

    expect(deal!.stage).toBe('property_selected');
    expect(deal!.propertyId).toBe('prop-2');
  });

  it('cancels active deal, open transaction and reopens property on lead cancel', async () => {
    const property = await properties.create({
      storeId: STORE,
      name: 'Casa Pontal',
      type: 'house',
      status: 'available',
      listingType: 'sale',
    });
    const lead = await leads.create({
      ...BASE_LEAD,
      name: 'Cancelado',
      matchedProperties: [{ id: property.id, name: property.name }],
    });
    const deal = await useCase.execute(lead);
    expect(deal).not.toBeNull();

    await properties.updateAvailability(STORE, property.id, 'reserved');
    await seedTransaction(transactions, {
      storeId: STORE,
      propertyId: property.id,
      leadId: lead.id,
      dealId: deal!.id,
      status: 'PROPOSAL',
    });

    const cancelled = await leads.updateStatus(
      STORE,
      lead.id,
      'cancelled',
      'Desistência',
    );
    expect(cancelled).not.toBeNull();

    const result = await useCase.execute(cancelled!);

    expect(result).toBeNull();
    expect(await deals.findActiveByLeadId(STORE, lead.id)).toBeNull();
    const tx = await transactions.findByDealId(STORE, deal!.id);
    expect(tx?.status).toBe('CANCELLED');
    expect((await properties.findById(STORE, property.id))?.status).toBe(
      'available',
    );
  });

  it('advances deal to contract_sent when lead has contract and property', async () => {
    const property = await properties.create({
      storeId: STORE,
      name: 'Casa Pontal',
      type: 'house',
      status: 'available',
      listingType: 'sale',
    });
    const lead = await leads.create({
      ...BASE_LEAD,
      name: 'Paula',
      matchedProperties: [{ id: property.id, name: property.name }],
      documents: [
        {
          name: 'Contrato.pdf',
          sizeLabel: '120 KB',
          kind: 'contract',
          addedAt: '2026-08-03',
        },
      ],
    });

    const deal = await useCase.execute(lead);

    expect(deal!.stage).toBe('contract_sent');
    expect((await properties.findById(STORE, property.id))?.status).toBe(
      'occupied',
    );
  });

  it('keeps property_selected when lead has only non-contract documents', async () => {
    const lead = await leads.create({
      ...BASE_LEAD,
      name: 'Rita',
      matchedProperties: [{ id: 'prop-1', name: 'Casa Pontal' }],
      documents: [
        {
          name: 'RG.pdf',
          sizeLabel: '80 KB',
          kind: 'other',
          addedAt: '2026-08-03',
        },
      ],
    });

    const deal = await useCase.execute(lead);

    expect(deal!.stage).toBe('property_selected');
  });

  it('updates early deal to contract_sent when contract is attached later', async () => {
    const property = await properties.create({
      storeId: STORE,
      name: 'Casa Pontal',
      type: 'house',
      status: 'available',
      listingType: 'sale',
    });
    const lead = await leads.create({
      ...BASE_LEAD,
      name: 'Lucas',
      matchedProperties: [{ id: property.id, name: property.name }],
    });
    await useCase.execute(lead);
    expect((await properties.findById(STORE, property.id))?.status).toBe(
      'reserved',
    );

    const updatedLead = await leads.update(STORE, lead.id, {
      ...BASE_LEAD,
      name: 'Lucas',
      matchedProperties: [{ id: property.id, name: property.name }],
      documents: [
        {
          name: 'Contrato.pdf',
          sizeLabel: '80 KB',
          kind: 'contract',
          addedAt: '2026-08-03',
        },
      ],
    });
    expect(updatedLead).not.toBeNull();

    const deal = await useCase.execute(updatedLead!);

    expect(deal!.stage).toBe('contract_sent');
    expect((await properties.findById(STORE, property.id))?.status).toBe(
      'occupied',
    );
  });

  it('aligns property to occupied when deal is already past early stages', async () => {
    const property = await properties.create({
      storeId: STORE,
      name: 'Casa Pontal',
      type: 'house',
      status: 'available',
      listingType: 'sale',
    });
    const lead = await leads.create({
      ...BASE_LEAD,
      name: 'Helena',
      matchedProperties: [{ id: property.id, name: property.name }],
      documents: [
        {
          name: 'Contrato.pdf',
          sizeLabel: '80 KB',
          kind: 'contract',
          addedAt: '2026-08-03',
        },
      ],
    });
    await deals.create({
      storeId: STORE,
      leadId: lead.id,
      propertyId: property.id,
      propertyName: property.name,
      leadName: lead.name,
      stage: 'contract_sent',
      title: 'Negócio',
    });

    await useCase.execute(lead);

    expect((await properties.findById(STORE, property.id))?.status).toBe(
      'occupied',
    );
  });
});
