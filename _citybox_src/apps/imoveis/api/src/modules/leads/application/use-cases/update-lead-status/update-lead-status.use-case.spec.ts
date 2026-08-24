import { UpdateLeadStatusUseCase } from './update-lead-status.use-case';
import { LeadNotFoundError } from '../../../domain/errors/lead-not-found.error';
import { InMemoryLeadRepository } from '../../../infrastructure/database/in-memory-lead.repository';
import { makeCreateLeadUseCase } from '../shared/lead-use-case-test-fixtures';
import { InMemoryAppointmentRepository } from '../../../../appointments/infrastructure/database/in-memory-appointment.repository';
import { SyncActiveDealForLeadUseCase } from '../../../../deals/application/use-cases/sync-active-deal-for-lead/sync-active-deal-for-lead.use-case';
import { InMemoryDealRepository } from '../../../../deals/infrastructure/database/in-memory-deal.repository';
import { InMemoryPropertyRepository } from '../../../../properties/infrastructure/database/in-memory-property.repository';
import { seedTransaction } from '../../../../transactions/application/use-cases/shared/transaction-test-fixtures';
import { InMemoryTransactionRepository } from '../../../../transactions/infrastructure/database/in-memory-transaction.repository';

const STORE = 'store-1';

describe('UpdateLeadStatusUseCase', () => {
  function makeSync(
    deals = new InMemoryDealRepository(),
    properties = new InMemoryPropertyRepository(),
    transactions = new InMemoryTransactionRepository(),
  ) {
    return new SyncActiveDealForLeadUseCase(deals, properties, transactions);
  }

  async function seed() {
    const repo = new InMemoryLeadRepository();
    const created = await makeCreateLeadUseCase(
      repo,
      new InMemoryAppointmentRepository(),
    ).execute({
      storeId: STORE,
      name: 'Bruno',
      status: 'new',
      leadSource: 'walk-in',
      interestedPropertyType: 'house',
      purpose: 'buying',
    });
    return { repo, id: created.id };
  }

  it('atualiza status e registra activity', async () => {
    const { repo, id } = await seed();
    const useCase = new UpdateLeadStatusUseCase(repo, makeSync());

    const result = await useCase.execute({
      storeId: STORE,
      id,
      status: 'negotiating',
    });

    expect(result.status).toBe('negotiating');
    expect(
      result.activities.some((a) => a.message.includes('Em negociação')),
    ).toBe(true);
  });

  it('ao cancelar lead com negócio aberto, libera o imóvel', async () => {
    const leads = new InMemoryLeadRepository();
    const deals = new InMemoryDealRepository();
    const properties = new InMemoryPropertyRepository();
    const transactions = new InMemoryTransactionRepository();
    const sync = makeSync(deals, properties, transactions);

    const property = await properties.create({
      storeId: STORE,
      name: 'Casa Pontal',
      type: 'house',
      status: 'available',
      listingType: 'sale',
    });
    const lead = await leads.create({
      storeId: STORE,
      name: 'Bruno',
      status: 'negotiating',
      leadSource: 'walk-in',
      interestedPropertyType: 'house',
      purpose: 'buying',
      matchedProperties: [{ id: property.id, name: property.name }],
    });
    const deal = await sync.execute(lead);
    expect(deal).not.toBeNull();

    await properties.updateAvailability(STORE, property.id, 'reserved');
    await seedTransaction(transactions, {
      storeId: STORE,
      propertyId: property.id,
      leadId: lead.id,
      dealId: deal!.id,
      status: 'PROPOSAL',
    });

    const useCase = new UpdateLeadStatusUseCase(leads, sync);
    await useCase.execute({
      storeId: STORE,
      id: lead.id,
      status: 'cancelled',
    });

    expect(await deals.findActiveByLeadId(STORE, lead.id)).toBeNull();
    expect((await properties.findById(STORE, property.id))?.status).toBe(
      'available',
    );
  });

  it('404 quando lead não existe', async () => {
    const repo = new InMemoryLeadRepository();
    const useCase = new UpdateLeadStatusUseCase(repo, makeSync());

    await expect(
      useCase.execute({
        storeId: STORE,
        id: 'missing',
        status: 'new',
      }),
    ).rejects.toBeInstanceOf(LeadNotFoundError);
  });
});
