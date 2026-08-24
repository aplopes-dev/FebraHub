import { InMemoryLeadRepository } from '../../../../leads/infrastructure/database/in-memory-lead.repository';
import { makeCreateLeadUseCase } from '../../../../leads/application/use-cases/shared/lead-use-case-test-fixtures';
import { InMemoryAppointmentRepository } from '../../../../appointments/infrastructure/database/in-memory-appointment.repository';
import { InMemoryPropertyRepository } from '../../../../properties/infrastructure/database/in-memory-property.repository';
import { LeadNotFoundError } from '../../../../leads/domain/errors/lead-not-found.error';
import { PropertyNotFoundError } from '../../../../properties/domain/errors/property-not-found.error';
import { InMemoryDealRepository } from '../../../infrastructure/database/in-memory-deal.repository';
import { CreateDealUseCase } from './create-deal.use-case';
import { TEST_STORE } from '../shared/deal-test-fixtures';

async function seedLead(repo: InMemoryLeadRepository, id = 'lead-1') {
  const lead = await makeCreateLeadUseCase(
    repo,
    new InMemoryAppointmentRepository(),
  ).execute({
    storeId: TEST_STORE,
    name: 'Maria Silva',
    status: 'new',
    leadSource: 'website',
    interestedPropertyType: 'house',
    purpose: 'buying',
  });
  return lead;
}

async function seedProperty(repo: InMemoryPropertyRepository) {
  return repo.create({
    storeId: TEST_STORE,
    name: 'Casa Pontal',
    city: 'Ilhéus',
    state: 'BA',
    type: 'house',
    status: 'available',
    listingType: 'sale',
    negotiable: true,
  });
}

describe('CreateDealUseCase', () => {
  let deals: InMemoryDealRepository;
  let leads: InMemoryLeadRepository;
  let properties: InMemoryPropertyRepository;
  let useCase: CreateDealUseCase;

  beforeEach(() => {
    deals = new InMemoryDealRepository();
    leads = new InMemoryLeadRepository();
    properties = new InMemoryPropertyRepository();
    useCase = new CreateDealUseCase(deals, leads, properties);
  });

  it('creates deal for lead without property at awaiting_property', async () => {
    const lead = await seedLead(leads);

    const deal = await useCase.execute({
      storeId: TEST_STORE,
      leadId: lead.id,
    });

    expect(deal.leadId).toBe(lead.id);
    expect(deal.stage).toBe('awaiting_property');
    expect(deal.status).toBe('active');
    expect(deal.propertyId).toBeNull();
  });

  it('creates deal with property at property_selected', async () => {
    const lead = await seedLead(leads);
    const property = await seedProperty(properties);

    const deal = await useCase.execute({
      storeId: TEST_STORE,
      leadId: lead.id,
      propertyId: property.id,
      type: 'SALE',
    });

    expect(deal.propertyId).toBe(property.id);
    expect(deal.propertyName).toBe('Casa Pontal');
    expect(deal.stage).toBe('property_selected');
    expect(deal.type).toBe('SALE');
  });

  it('throws when lead does not exist', async () => {
    await expect(
      useCase.execute({ storeId: TEST_STORE, leadId: 'missing' }),
    ).rejects.toBeInstanceOf(LeadNotFoundError);
  });

  it('throws when property does not exist', async () => {
    const lead = await seedLead(leads);
    await expect(
      useCase.execute({
        storeId: TEST_STORE,
        leadId: lead.id,
        propertyId: 'missing',
      }),
    ).rejects.toBeInstanceOf(PropertyNotFoundError);
  });
});
