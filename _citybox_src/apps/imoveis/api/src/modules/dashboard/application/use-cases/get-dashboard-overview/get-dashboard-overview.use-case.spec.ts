import { InMemoryAppointmentRepository } from '../../../../appointments/infrastructure/database/in-memory-appointment.repository';
import { InMemoryLeadRepository } from '../../../../leads/infrastructure/database/in-memory-lead.repository';
import { InMemoryPropertyRepository } from '../../../../properties/infrastructure/database/in-memory-property.repository';
import { InMemoryTransactionRepository } from '../../../../transactions/infrastructure/database/in-memory-transaction.repository';
import {
  seedTransaction,
  TEST_STORE,
} from '../../../../transactions/application/use-cases/shared/transaction-test-fixtures';
import { civilDayStartInBahia } from '../../../../transactions/application/policies/transaction-date.policy';
import { GetDashboardOverviewUseCase } from './get-dashboard-overview.use-case';

const NOW = new Date('2026-07-15T15:00:00.000-03:00');

describe('GetDashboardOverviewUseCase', () => {
  let transactions: InMemoryTransactionRepository;
  let leads: InMemoryLeadRepository;
  let properties: InMemoryPropertyRepository;
  let appointments: InMemoryAppointmentRepository;
  let useCase: GetDashboardOverviewUseCase;

  beforeEach(() => {
    transactions = new InMemoryTransactionRepository();
    leads = new InMemoryLeadRepository();
    properties = new InMemoryPropertyRepository();
    appointments = new InMemoryAppointmentRepository();
    useCase = new GetDashboardOverviewUseCase(
      transactions,
      leads,
      properties,
      appointments,
    );
  });

  it('aggregates KPIs, deals and revenue with AGENCY finance rules', async () => {
    await seedTransaction(transactions, {
      status: 'COMPLETED',
      grossValueCents: 1_000_000,
    });
    await seedTransaction(transactions, {
      status: 'PROPOSAL',
      grossValueCents: 500_000,
    });
    await seedTransaction(transactions, {
      status: 'CANCELLED',
      grossValueCents: 9_000_000,
    });

    await leads.create({
      storeId: TEST_STORE,
      name: 'Mariana Souza',
      status: 'new',
      leadSource: 'website',
      interestedPropertyType: 'house',
      purpose: 'buying',
    });
    await leads.create({
      storeId: TEST_STORE,
      name: 'Fechado',
      status: 'closed-won',
      leadSource: 'website',
      interestedPropertyType: 'house',
      purpose: 'buying',
    });

    await properties.create({
      storeId: TEST_STORE,
      name: 'Casa Pontal',
      type: 'house',
      status: 'available',
      listingType: 'sale',
    });
    await properties.create({
      storeId: TEST_STORE,
      name: 'Apt Centro',
      type: 'apartment',
      status: 'sold-out',
      listingType: 'sale',
    });

    const overview = await useCase.execute({
      storeId: TEST_STORE,
      organizationType: 'AGENCY',
      now: NOW,
    });

    const revenue = overview.metrics.find((m) => m.key === 'total-revenue');
    const activeLeads = overview.metrics.find((m) => m.key === 'active-leads');
    const listings = overview.metrics.find((m) => m.key === 'active-listings');
    const closed = overview.metrics.find((m) => m.key === 'total-closed');

    expect(revenue?.valueCents).toBe(1_500_000);
    expect(activeLeads?.valueCount).toBe(1);
    expect(listings?.valueCount).toBe(1);
    expect(closed?.valueCount).toBe(1);
    expect(overview.deals).toEqual({ closed: 1, inProgress: 1 });
    expect(overview.listings).toHaveLength(1);
    expect(overview.leads).toHaveLength(1);
    expect(overview.performance.period).toBe('monthly');
    expect(overview.performance.points).toHaveLength(8);
  });

  it('uses SINGLE_AGENT commission revenue and scopes actor', async () => {
    await seedTransaction(transactions, {
      status: 'COMPLETED',
      grossValueCents: 1_000_000,
      captorId: 'carla-mendes',
      sellerId: 'carla-mendes',
    });

    const empty = await useCase.execute({
      storeId: TEST_STORE,
      organizationType: 'SINGLE_AGENT',
      actorAgentId: 'ana-helena',
      now: NOW,
    });
    expect(
      empty.metrics.find((m) => m.key === 'total-revenue')?.valueCents,
    ).toBe(0);

    const scoped = await useCase.execute({
      storeId: TEST_STORE,
      organizationType: 'SINGLE_AGENT',
      actorAgentId: 'carla-mendes',
      now: NOW,
    });
    expect(
      scoped.metrics.find((m) => m.key === 'total-revenue')?.valueCents,
    ).toBe(60_000);
  });

  it('builds follow-up and visit reminders', async () => {
    await leads.create({
      storeId: TEST_STORE,
      name: 'Lead Retorno',
      status: 'negotiating',
      leadSource: 'website',
      interestedPropertyType: 'house',
      purpose: 'buying',
      nextFollowUp: '2026-07-10',
    });

    const start = civilDayStartInBahia('2026-07-16', 'from');
    await appointments.create({
      storeId: TEST_STORE,
      title: 'Visita',
      startsAt: start,
      endsAt: new Date(start.getTime() + 60 * 60 * 1000),
      kind: 'visit',
      agentId: 'ana-helena',
      leadName: 'Visitante',
      done: false,
    });

    const overview = await useCase.execute({
      storeId: TEST_STORE,
      organizationType: 'AGENCY',
      now: NOW,
    });

    expect(overview.reminders.some((r) => r.kind === 'follow-up')).toBe(true);
    expect(overview.reminders.some((r) => r.kind === 'visit')).toBe(true);
  });

  it('buckets visits into the performance series', async () => {
    const start = civilDayStartInBahia('2026-07-10', 'from');
    await appointments.create({
      storeId: TEST_STORE,
      title: 'Visita Jul',
      startsAt: start,
      endsAt: new Date(start.getTime() + 60 * 60 * 1000),
      kind: 'visit',
      agentId: 'ana-helena',
    });

    const overview = await useCase.execute({
      storeId: TEST_STORE,
      organizationType: 'AGENCY',
      period: 'monthly',
      now: NOW,
    });

    const jul = overview.performance.points.find((p) => p.label === 'Jul');
    expect(jul?.visitsCount).toBe(1);
    expect(jul?.visitsPct).toBe(100);
  });

  it('scopes KPIs and previews to the agent performance when scopeAgentId is set', async () => {
    await seedTransaction(transactions, {
      status: 'COMPLETED',
      grossValueCents: 1_000_000,
      captorId: 'ana-helena',
      sellerId: 'ana-helena',
    });
    await seedTransaction(transactions, {
      status: 'COMPLETED',
      grossValueCents: 2_000_000,
      captorId: 'bruno-costa',
      sellerId: 'bruno-costa',
    });

    await leads.create({
      storeId: TEST_STORE,
      name: 'Lead Ana',
      status: 'new',
      leadSource: 'website',
      interestedPropertyType: 'house',
      purpose: 'buying',
      agentId: 'ana-helena',
    });
    await leads.create({
      storeId: TEST_STORE,
      name: 'Lead Bruno',
      status: 'new',
      leadSource: 'website',
      interestedPropertyType: 'house',
      purpose: 'buying',
      agentId: 'bruno-costa',
    });

    await properties.create({
      storeId: TEST_STORE,
      name: 'Casa Ana',
      type: 'house',
      status: 'available',
      listingType: 'sale',
      agentId: 'ana-helena',
    });
    await properties.create({
      storeId: TEST_STORE,
      name: 'Casa Bruno',
      type: 'house',
      status: 'available',
      listingType: 'sale',
      agentId: 'bruno-costa',
    });

    const overview = await useCase.execute({
      storeId: TEST_STORE,
      organizationType: 'AGENCY',
      scopeAgentId: 'ana-helena',
      now: NOW,
    });

    expect(
      overview.metrics.find((m) => m.key === 'active-leads')?.valueCount,
    ).toBe(1);
    expect(
      overview.metrics.find((m) => m.key === 'active-listings')?.valueCount,
    ).toBe(1);
    expect(
      overview.metrics.find((m) => m.key === 'total-closed')?.valueCount,
    ).toBe(1);
    expect(
      overview.metrics.find((m) => m.key === 'total-revenue')?.valueCents,
    ).toBe(1_000_000);
    expect(overview.leads).toHaveLength(1);
    expect(overview.leads[0]?.name).toBe('Lead Ana');
    expect(overview.listings).toHaveLength(1);
    expect(overview.listings[0]?.name).toBe('Casa Ana');
  });

  it('omits metrics and sections when modules are disabled', async () => {
    await seedTransaction(transactions, {
      status: 'COMPLETED',
      grossValueCents: 1_000_000,
    });
    await leads.create({
      storeId: TEST_STORE,
      name: 'Lead',
      status: 'new',
      leadSource: 'website',
      interestedPropertyType: 'house',
      purpose: 'buying',
    });

    const overview = await useCase.execute({
      storeId: TEST_STORE,
      organizationType: 'AGENCY',
      modules: {
        leads: false,
        properties: false,
        transactions: true,
        finance: false,
        calendar: false,
      },
      now: NOW,
    });

    expect(overview.metrics.map((m) => m.key)).toEqual(['total-closed']);
    expect(overview.leads).toEqual([]);
    expect(overview.listings).toEqual([]);
    expect(overview.reminders).toEqual([]);
    expect(overview.deals.closed).toBe(1);
  });
});
