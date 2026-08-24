import { InMemoryAppointmentRepository } from '../../../../appointments/infrastructure/database/in-memory-appointment.repository';
import { InMemoryDealRepository } from '../../../../deals/infrastructure/database/in-memory-deal.repository';
import { InMemoryLeadRepository } from '../../../../leads/infrastructure/database/in-memory-lead.repository';
import { InMemoryStoreSettingsRepository } from '../../../../settings/infrastructure/database/in-memory-store-settings.repository';
import {
  DEFAULT_INTEGRATION_SETTINGS,
  DEFAULT_NOTIFICATION_SETTINGS,
  DEFAULT_SYSTEM_SETTINGS,
  cloneIntegrationSettings,
} from '../../../../settings/domain/entities/store-settings.entity';
import { civilDayStartInBahia } from '../../../../transactions/application/policies/transaction-date.policy';
import { GetRemindersUseCase } from './get-reminders.use-case';

const STORE = 'store-reminders';
const NOW = new Date('2026-07-15T15:00:00.000-03:00');

describe('GetRemindersUseCase', () => {
  let leads: InMemoryLeadRepository;
  let appointments: InMemoryAppointmentRepository;
  let deals: InMemoryDealRepository;
  let settings: InMemoryStoreSettingsRepository;
  let useCase: GetRemindersUseCase;

  beforeEach(() => {
    leads = new InMemoryLeadRepository();
    appointments = new InMemoryAppointmentRepository();
    deals = new InMemoryDealRepository();
    settings = new InMemoryStoreSettingsRepository();
    useCase = new GetRemindersUseCase(leads, appointments, deals, settings);
  });

  it('returns empty when there are no follow-ups or appointments', async () => {
    const result = await useCase.execute({ storeId: STORE, now: NOW });
    expect(result.reminders).toEqual([]);
  });

  it('builds follow-up and visit reminder cards', async () => {
    await leads.create({
      storeId: STORE,
      name: 'Lead Retorno',
      status: 'negotiating',
      leadSource: 'website',
      interestedPropertyType: 'house',
      purpose: 'buying',
      nextFollowUp: '2026-07-10',
    });

    const start = civilDayStartInBahia('2026-07-16', 'from');
    await appointments.create({
      storeId: STORE,
      title: 'Visita',
      startsAt: start,
      endsAt: new Date(start.getTime() + 60 * 60 * 1000),
      kind: 'visit',
      agentId: 'ana-helena',
      leadName: 'Visitante',
      done: false,
    });

    const result = await useCase.execute({ storeId: STORE, now: NOW });
    expect(result.reminders.some((r) => r.kind === 'follow-up')).toBe(true);
    expect(result.reminders.some((r) => r.kind === 'visit')).toBe(true);
    expect(result.reminders.find((r) => r.kind === 'follow-up')?.href).toBe(
      '/leads',
    );
  });

  it('filters by agentId', async () => {
    await leads.create({
      storeId: STORE,
      name: 'Lead Ana',
      status: 'new',
      leadSource: 'website',
      interestedPropertyType: 'house',
      purpose: 'buying',
      nextFollowUp: '2026-07-10',
      agentId: 'ana-helena',
    });
    await leads.create({
      storeId: STORE,
      name: 'Lead Outro',
      status: 'new',
      leadSource: 'website',
      interestedPropertyType: 'house',
      purpose: 'buying',
      nextFollowUp: '2026-07-10',
      agentId: 'outro',
    });

    const result = await useCase.execute({
      storeId: STORE,
      agentId: 'ana-helena',
      now: NOW,
    });
    // 1 follow-up + 1 card “new-lead” do site (mesmo lead tem ambas as faces se elegível)
    expect(result.reminders.some((r) => r.kind === 'follow-up')).toBe(true);
    expect(result.reminders.some((r) => r.kind === 'new-lead')).toBe(true);
    const newLead = result.reminders.find((r) => r.kind === 'new-lead');
    expect(newLead?.people?.[0]?.name).toBe('Lead Ana');
  });

  it('notifies website and whatsapp new leads', async () => {
    await leads.create({
      storeId: STORE,
      name: 'Site Lead',
      status: 'new',
      leadSource: 'website',
      interestedPropertyType: 'apartment',
      purpose: 'buying',
      agentId: 'ana-helena',
    });
    await leads.create({
      storeId: STORE,
      name: 'WA Lead',
      status: 'new',
      leadSource: 'whatsapp',
      interestedPropertyType: 'house',
      purpose: 'renting',
      agentId: 'ana-helena',
    });
    await leads.create({
      storeId: STORE,
      name: 'Walk-in',
      status: 'new',
      leadSource: 'walk-in',
      interestedPropertyType: 'house',
      purpose: 'buying',
      agentId: 'ana-helena',
    });

    const result = await useCase.execute({
      storeId: STORE,
      agentId: 'ana-helena',
      now: NOW,
    });

    const newLeads = result.reminders.filter((r) => r.kind === 'new-lead');
    expect(newLeads).toHaveLength(2);
    expect(newLeads.map((r) => r.description).sort()).toEqual(
      ['Site Lead entrou pelo site', 'WA Lead entrou pelo WhatsApp'].sort(),
    );
    expect(newLeads.every((r) => r.href?.startsWith('/leads/'))).toBe(true);
  });

  it('emits document reminders when documentsAlerts is on', async () => {
    await settings.upsert(STORE, {
      system: { ...DEFAULT_SYSTEM_SETTINGS },
      notifications: { ...DEFAULT_NOTIFICATION_SETTINGS, documentsAlerts: true },
      integrations: cloneIntegrationSettings(DEFAULT_INTEGRATION_SETTINGS),
    });
    const lead = await leads.create({
      storeId: STORE,
      name: 'Contrato Ana',
      status: 'negotiating',
      leadSource: 'website',
      interestedPropertyType: 'house',
      purpose: 'buying',
    });
    await leads.addDocument(STORE, lead.id, {
      id: 'doc-1',
      name: 'Contrato.pdf',
      sizeLabel: '10 KB',
      kind: 'contract',
      addedAt: NOW,
      objectKey: 'key',
      mimeType: 'application/pdf',
    });

    const result = await useCase.execute({ storeId: STORE, now: NOW });
    expect(result.reminders.some((r) => r.kind === 'document')).toBe(true);
    expect(
      result.reminders.find((r) => r.title === 'Contrato sem envio')?.href,
    ).toContain(lead.id);
  });

  it('keeps returning reminders when document alerts lookup fails', async () => {
    const explodingSettings = {
      findByStoreId: async () => {
        throw new Error('settings down');
      },
    };
    useCase = new GetRemindersUseCase(
      leads,
      appointments,
      deals,
      explodingSettings as never,
    );
    await expect(
      useCase.execute({ storeId: STORE, now: NOW }),
    ).resolves.toEqual({ reminders: [] });
  });
});
