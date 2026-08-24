import { LeadEntity } from '../../../../leads/domain/entities/lead.entity';
import { LeadNotFoundError } from '../../../../leads/domain/errors/lead-not-found.error';
import type { LeadRepository } from '../../../../leads/domain/repositories/lead.repository.interface';
import { PropertyEntity } from '../../../../properties/domain/entities/property.entity';
import { PropertyNotFoundError } from '../../../../properties/domain/errors/property-not-found.error';
import { InMemoryPropertyRepository } from '../../../../properties/infrastructure/database/in-memory-property.repository';
import type { PropertyRepository } from '../../../../properties/domain/repositories/property.repository.interface';
import { InMemoryCommissionConfigRepository } from '../../../../finance/infrastructure/database/in-memory-commission-config.repository';
import { InMemoryDealRepository } from '../../../../deals/infrastructure/database/in-memory-deal.repository';
import { seedDeal } from '../../../../deals/application/use-cases/shared/deal-test-fixtures';
import { PropertyUnavailableError } from '../../../domain/errors/property-unavailable.error';
import { DealAlreadyHasTransactionError } from '../../../domain/errors/deal-already-has-transaction.error';
import { InMemoryTransactionRepository } from '../../../infrastructure/database/in-memory-transaction.repository';
import {
  seedTransaction,
  TEST_STORE,
} from '../shared/transaction-test-fixtures';
import {
  CreateTransactionUseCase,
  type CreateTransactionInput,
} from './create-transaction.use-case';

const PROPERTY_ID = 'prop-1';
const LEAD_ID = 'lead-1';

function makeProperty(
  agentId: string | null,
  status: 'available' | 'sold-out' | 'occupied' | 'reserved' = 'available',
): PropertyEntity {
  const now = new Date('2026-07-01T12:00:00.000Z');
  return PropertyEntity.create(
    {
      storeId: TEST_STORE,
      name: 'Casa Pontal',
      city: 'Ilhéus',
      state: 'BA',
      type: 'house',
      units: 1,
      cost: 850_000,
      views: 0,
      status,
      occupiedUnits: null,
      listingType: 'sale',
      negotiable: true,
      bedrooms: 3,
      floors: 2,
      sizeSqm: 180,
      yearBuilt: 2019,
      address: 'Rua das Palmeiras, 100',
      country: 'Brasil',
      zipCode: '45650-000',
      mapCoordinate: '-14.79,-39.03',
      typeCode: null,
      description: '',
      highlights: [],
      totalActiveLeads: 0,
      agentId,
      photos: [],
      documents: [],
      activeLeads: [],
      createdAt: now,
      updatedAt: now,
    },
    PROPERTY_ID,
  );
}

function makeLead(): LeadEntity {
  const now = new Date('2026-07-01T12:00:00.000Z');
  return LeadEntity.create(
    {
      storeId: TEST_STORE,
      name: 'Mariana Souza',
      email: 'mariana@example.com',
      phone: '+5573999990000',
      city: 'Ilhéus',
      state: 'BA',
      status: 'negotiating',
      leadSource: 'website',
      interestedPropertyType: 'house',
      budgetRange: '800k-900k',
      preferredLocation: 'Pontal',
      purpose: 'buying',
      latestFollowUp: null,
      nextFollowUp: null,
      notes: '',
      photoUrl: null,
      propertyName: null,
      hasSuggestion: false,
      agentId: null,
      agentIds: [],
      matchedProperties: [],
      documents: [],
      activities: [],
      createdAt: now,
      updatedAt: now,
    },
    LEAD_ID,
  );
}

function stubPropertyRepository(property: PropertyEntity | null) {
  return {
    async findById() {
      return await Promise.resolve(property);
    },
    async updateAvailability() {
      return await Promise.resolve(property);
    },
  } as unknown as PropertyRepository;
}

function stubLeadRepository(lead: LeadEntity | null) {
  return {
    async findById() {
      return await Promise.resolve(lead);
    },
  } as unknown as LeadRepository;
}

const BASE_INPUT: CreateTransactionInput = {
  storeId: TEST_STORE,
  type: 'SALE',
  propertyId: PROPERTY_ID,
  leadId: LEAD_ID,
  grossValueCents: 1_000_000,
  paymentMethod: 'pix',
  sellerId: 'bruno-costa',
  initialStatus: 'PROPOSAL',
  actorAgentId: 'ana-helena',
  organizationType: 'AGENCY',
  actorRole: 'ADMIN',
  actorName: 'Ana Helena',
};

describe('CreateTransactionUseCase', () => {
  let transactions: InMemoryTransactionRepository;
  let configs: InMemoryCommissionConfigRepository;
  let deals: InMemoryDealRepository;

  beforeEach(() => {
    transactions = new InMemoryTransactionRepository();
    configs = new InMemoryCommissionConfigRepository();
    deals = new InMemoryDealRepository();
  });

  function makeUseCase(
    property: PropertyEntity | null,
    lead: LeadEntity | null,
  ) {
    return new CreateTransactionUseCase(
      transactions,
      stubPropertyRepository(property),
      stubLeadRepository(lead),
      configs,
      deals,
    );
  }

  it('creates a sale using the default commission config', async () => {
    const useCase = makeUseCase(makeProperty('carla-mendes'), makeLead());

    const transaction = await useCase.execute(BASE_INPUT);

    expect(transaction.title).toBe('Venda — Casa Pontal');
    expect(transaction.commissionPercent).toBe(6);
    expect(transaction.splitSource).toBe('GLOBAL');
    expect(transaction.split.totalCommissionCents).toBe(60_000);
    expect(transaction.split.agencyAmountCents).toBe(24_000);
    expect(transaction.captorId).toBe('carla-mendes');
    expect(transaction.sellerId).toBe('bruno-costa');
    expect(transaction.paymentMethod).toBe('pix');
    expect(transaction.rental).toBeNull();
    expect(transaction.activityLog).toHaveLength(1);
    expect(transaction.activityLog[0].actorName).toBe('Ana Helena');
    expect(transaction.activityLog[0].message).toContain('PIX');
  });

  it('persists the selected payment method', async () => {
    const useCase = makeUseCase(makeProperty('carla-mendes'), makeLead());

    const transaction = await useCase.execute({
      ...BASE_INPUT,
      paymentMethod: 'financing',
    });

    expect(transaction.paymentMethod).toBe('financing');
    expect(transaction.activityLog[0].message).toContain(
      'Financiamento bancário',
    );
  });

  it('persists trade-in with the same label as the lead form', async () => {
    const useCase = makeUseCase(makeProperty('carla-mendes'), makeLead());

    const transaction = await useCase.execute({
      ...BASE_INPUT,
      paymentMethod: 'trade-in',
    });

    expect(transaction.paymentMethod).toBe('trade-in');
    expect(transaction.activityLog[0].message).toContain(
      'Permuta / dação de imóvel',
    );
  });

  it('uses the stored config and applies the captor override', async () => {
    await configs.upsert(TEST_STORE, {
      global: {
        defaultCommissionPercent: 5,
        defaultSplit: {
          agencyPercent: 40,
          captorPercent: 30,
          sellerPercent: 30,
        },
      },
      agentOverrides: [
        {
          agentId: 'carla-mendes',
          captorPercentOverride: 50,
          sellerPercentOverride: null,
        },
      ],
    });
    const useCase = makeUseCase(makeProperty('carla-mendes'), makeLead());

    const transaction = await useCase.execute(BASE_INPUT);

    expect(transaction.commissionPercent).toBe(5);
    expect(transaction.splitSource).toBe('AGENT_OVERRIDE');
    expect(transaction.split.captorPercent).toBe(50);
    expect(transaction.split.agencyPercent).toBe(20);
  });

  it('assigns captor and seller to the actor in a single-agent org', async () => {
    const useCase = makeUseCase(makeProperty('carla-mendes'), makeLead());

    const transaction = await useCase.execute({
      ...BASE_INPUT,
      organizationType: 'SINGLE_AGENT',
      actorRole: 'AUTONOMOUS',
    });

    expect(transaction.captorId).toBe('ana-helena');
    expect(transaction.sellerId).toBe('ana-helena');
  });

  it('seeds a default rental config for rentals', async () => {
    const useCase = makeUseCase(makeProperty(null), makeLead());

    const transaction = await useCase.execute({
      ...BASE_INPUT,
      type: 'RENTAL',
      grossValueCents: 300_000,
    });

    expect(transaction.title).toBe('Locação — Casa Pontal');
    expect(transaction.rental).not.toBeNull();
    expect(transaction.rental?.payoutStatus).toBe('AWAITING_PAYMENT');
    expect(transaction.rental?.baseRentCents).toBe(300_000);
    expect(transaction.rental?.tenantName).toBe('Mariana Souza');
  });

  it('falls back to the actor when the property has no agent', async () => {
    const useCase = makeUseCase(makeProperty(null), makeLead());

    const transaction = await useCase.execute(BASE_INPUT);

    expect(transaction.captorId).toBe('ana-helena');
  });

  it('rejects unknown property or lead', async () => {
    await expect(
      makeUseCase(null, makeLead()).execute(BASE_INPUT),
    ).rejects.toBeInstanceOf(PropertyNotFoundError);

    await expect(
      makeUseCase(makeProperty(null), null).execute(BASE_INPUT),
    ).rejects.toBeInstanceOf(LeadNotFoundError);
  });

  it('rejects non-available property', async () => {
    await expect(
      makeUseCase(makeProperty(null, 'sold-out'), makeLead()).execute(
        BASE_INPUT,
      ),
    ).rejects.toBeInstanceOf(PropertyUnavailableError);

    await expect(
      makeUseCase(makeProperty(null, 'reserved'), makeLead()).execute(
        BASE_INPUT,
      ),
    ).rejects.toBeInstanceOf(PropertyUnavailableError);
  });

  it('allows reserved property when already linked to the lead', async () => {
    const now = new Date('2026-07-01T12:00:00.000Z');
    const linkedLead = LeadEntity.create(
      {
        storeId: TEST_STORE,
        name: 'Mariana Souza',
        email: 'mariana@example.com',
        phone: '+5573999990000',
        city: 'Ilhéus',
        state: 'BA',
        status: 'negotiating',
        leadSource: 'website',
        interestedPropertyType: 'house',
        budgetRange: '800k-900k',
        preferredLocation: 'Pontal',
        purpose: 'buying',
        latestFollowUp: null,
        nextFollowUp: null,
        notes: '',
        photoUrl: null,
        propertyName: null,
        hasSuggestion: false,
        agentId: null,
        agentIds: [],
        matchedProperties: [
          {
            id: 'mp-1',
            propertyId: PROPERTY_ID,
            propertyName: 'Casa Pontal',
            sortOrder: 0,
          },
        ],
        documents: [],
        activities: [],
        createdAt: now,
        updatedAt: now,
      },
      LEAD_ID,
    );

    const created = await makeUseCase(
      makeProperty(null, 'reserved'),
      linkedLead,
    ).execute(BASE_INPUT);

    expect(created.propertyId).toBe(PROPERTY_ID);
    expect(created.status).toBe('PROPOSAL');
  });

  it('marks property as reserved after create', async () => {
    const properties = new InMemoryPropertyRepository();
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
    const useCase = new CreateTransactionUseCase(
      transactions,
      properties,
      stubLeadRepository(makeLead()),
      configs,
      deals,
    );

    await useCase.execute({ ...BASE_INPUT, propertyId: property.id });

    const updated = await properties.findById(TEST_STORE, property.id);
    expect(updated?.status).toBe('reserved');
  });

  it('links active deal, advances stage and rejects duplicate transaction', async () => {
    const deal = await seedDeal(deals, {
      leadId: LEAD_ID,
      propertyId: PROPERTY_ID,
      stage: 'contract_sent',
    });
    const useCase = makeUseCase(makeProperty('carla-mendes'), makeLead());

    const transaction = await useCase.execute(BASE_INPUT);

    expect(transaction.dealId).toBe(deal.id);

    const updatedDeal = await deals.findById(TEST_STORE, deal.id);
    expect(updatedDeal?.stage).toBe('contract_signed');
    expect(updatedDeal?.type).toBe('SALE');

    await expect(useCase.execute(BASE_INPUT)).rejects.toBeInstanceOf(
      DealAlreadyHasTransactionError,
    );
  });

  it.each<['won' | 'cancelled', 'handover' | 'contract_signed']>([
    ['won', 'handover'],
    ['cancelled', 'contract_signed'],
  ])(
    'creates a fresh active deal when the resolved deal is %s',
    async (status, stage) => {
      const concluded = await seedDeal(deals, {
        leadId: LEAD_ID,
        propertyId: PROPERTY_ID,
        stage,
        status,
      });
      await seedTransaction(transactions, { dealId: concluded.id });
      const useCase = makeUseCase(makeProperty('carla-mendes'), makeLead());

      const transaction = await useCase.execute({
        ...BASE_INPUT,
        dealId: concluded.id,
      });

      expect(transaction.dealId).not.toBe(concluded.id);
      expect(transaction.dealId).not.toBeNull();

      const fresh = await deals.findById(TEST_STORE, transaction.dealId!);
      expect(fresh?.status).toBe('active');
      expect(fresh?.stage).toBe('contract_signed');
      expect(fresh?.propertyId).toBe(PROPERTY_ID);
      expect(fresh?.type).toBe('SALE');
    },
  );

  it.each<['COMPLETED' | 'CANCELLED', 'payment_confirmed' | 'contract_signed']>(
    [
      ['COMPLETED', 'payment_confirmed'],
      ['CANCELLED', 'contract_signed'],
    ],
  )(
    'creates a fresh active deal when the active deal already has a %s transaction',
    async (txStatus, stage) => {
      const deal = await seedDeal(deals, {
        leadId: LEAD_ID,
        propertyId: PROPERTY_ID,
        stage,
      });
      await seedTransaction(transactions, {
        dealId: deal.id,
        status: txStatus,
      });
      const useCase = makeUseCase(makeProperty('carla-mendes'), makeLead());

      const transaction = await useCase.execute({
        ...BASE_INPUT,
        dealId: deal.id,
      });

      expect(transaction.dealId).not.toBe(deal.id);
      expect(transaction.dealId).not.toBeNull();

      const fresh = await deals.findById(TEST_STORE, transaction.dealId!);
      expect(fresh?.status).toBe('active');
      expect(fresh?.stage).toBe('contract_signed');
      expect(fresh?.propertyId).toBe(PROPERTY_ID);
      expect(fresh?.leadId).toBe(LEAD_ID);
    },
  );

  it('keeps blocking a second transaction while the deal has an open negotiation', async () => {
    const deal = await seedDeal(deals, {
      leadId: LEAD_ID,
      propertyId: PROPERTY_ID,
      stage: 'contract_signed',
    });
    await seedTransaction(transactions, {
      dealId: deal.id,
      status: 'CONTRACT_SIGNED',
    });

    await expect(
      makeUseCase(makeProperty('carla-mendes'), makeLead()).execute({
        ...BASE_INPUT,
        dealId: deal.id,
      }),
    ).rejects.toBeInstanceOf(DealAlreadyHasTransactionError);
  });
});
