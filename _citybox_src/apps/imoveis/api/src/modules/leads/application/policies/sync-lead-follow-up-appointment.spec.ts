import {
  briefFollowUpDescription,
  syncLeadFollowUpAppointment,
  toFollowUpDateOnly,
} from './sync-lead-follow-up-appointment';
import { InMemoryAppointmentRepository } from '../../../appointments/infrastructure/database/in-memory-appointment.repository';
import { InMemoryLeadRepository } from '../../infrastructure/database/in-memory-lead.repository';
import { makeCreateLeadUseCase } from '../use-cases/shared/lead-use-case-test-fixtures';

const STORE = 'store-1';

describe('syncLeadFollowUpAppointment', () => {
  it('toFollowUpDateOnly aceita string e Date', () => {
    expect(toFollowUpDateOnly('2026-08-05')).toBe('2026-08-05');
    expect(toFollowUpDateOnly(new Date('2026-08-05T00:00:00.000Z'))).toBe(
      '2026-08-05',
    );
    expect(toFollowUpDateOnly('')).toBeNull();
    expect(toFollowUpDateOnly(null)).toBeNull();
  });

  it('briefFollowUpDescription trunca em 40 chars', () => {
    expect(briefFollowUpDescription('')).toBe('Retornar contato');
    expect(briefFollowUpDescription('Ligação amanhã')).toBe('Ligação amanhã');
    const long = 'a'.repeat(50);
    expect(briefFollowUpDescription(long).length).toBe(40);
  });

  it('cria compromisso follow-up quando há data + agente', async () => {
    const leads = new InMemoryLeadRepository();
    const appointments = new InMemoryAppointmentRepository();
    const lead = await makeCreateLeadUseCase(leads, appointments).execute({
      storeId: STORE,
      name: 'Maria Souza',
      email: 'maria@example.com',
      phone: '(73) 99999-1111',
      status: 'new',
      leadSource: 'website',
      interestedPropertyType: 'apartment',
      purpose: 'buying',
      nextFollowUp: '2026-08-10',
      notes: 'Confirmar visita ao apto',
      agentIds: ['ana-helena'],
    });

    const appt = await appointments.findOpenFollowUpByLeadId(STORE, lead.id);
    expect(appt).not.toBeNull();
    expect(appt!.kind).toBe('follow-up');
    expect(appt!.title).toBe('Maria Souza');
    expect(appt!.description).toBe('Confirmar visita ao apto');
    expect(appt!.agentId).toBe('ana-helena');
    expect(appt!.leadId).toBe(lead.id);
    expect(appt!.leadName).toBe('Maria Souza');
    expect(appt!.done).toBe(false);
  });

  it('não cria compromisso sem agente', async () => {
    const leads = new InMemoryLeadRepository();
    const appointments = new InMemoryAppointmentRepository();
    const lead = await makeCreateLeadUseCase(leads, appointments).execute({
      storeId: STORE,
      name: 'Sem Agente',
      status: 'new',
      leadSource: 'website',
      interestedPropertyType: 'house',
      purpose: 'renting',
      nextFollowUp: '2026-08-10',
      agentIds: [],
    });

    const appt = await appointments.findOpenFollowUpByLeadId(STORE, lead.id);
    expect(appt).toBeNull();
  });

  it('remove follow-up pendente quando data é limpa', async () => {
    const leads = new InMemoryLeadRepository();
    const appointments = new InMemoryAppointmentRepository();
    const create = makeCreateLeadUseCase(leads, appointments);
    const lead = await create.execute({
      storeId: STORE,
      name: 'João',
      status: 'new',
      leadSource: 'website',
      interestedPropertyType: 'apartment',
      purpose: 'buying',
      nextFollowUp: '2026-08-10',
      agentIds: ['agent-1'],
    });

    expect(
      await appointments.findOpenFollowUpByLeadId(STORE, lead.id),
    ).not.toBeNull();

    const updated = await leads.update(STORE, lead.id, {
      name: 'João',
      status: 'new',
      leadSource: 'website',
      interestedPropertyType: 'apartment',
      purpose: 'buying',
      nextFollowUp: null,
      agentIds: ['agent-1'],
    });
    await syncLeadFollowUpAppointment(appointments, updated!);

    expect(
      await appointments.findOpenFollowUpByLeadId(STORE, lead.id),
    ).toBeNull();
  });

  it('tenta sincronizar no Google Calendar ao criar follow-up', async () => {
    const appointments = new InMemoryAppointmentRepository();
    const leads = new InMemoryLeadRepository();
    const google = {
      upsertEventForAgent: jest.fn().mockResolvedValue('gcal-event-1'),
      deleteEventForAgent: jest.fn().mockResolvedValue(undefined),
    };

    const lead = await leads.create({
      storeId: STORE,
      name: 'Carlos',
      status: 'new',
      leadSource: 'website',
      interestedPropertyType: 'apartment',
      purpose: 'buying',
      nextFollowUp: '2026-08-12',
      agentIds: ['daniel-lopes'],
    });

    await syncLeadFollowUpAppointment(appointments, lead, google as never);

    expect(google.upsertEventForAgent).toHaveBeenCalledTimes(1);
    const appt = await appointments.findOpenFollowUpByLeadId(STORE, lead.id);
    expect(appt?.googleEventId).toBe('gcal-event-1');
    expect(appt?.kind).toBe('follow-up');
  });

  it('remove evento Google ao limpar nextFollowUp', async () => {
    const appointments = new InMemoryAppointmentRepository();
    const google = {
      upsertEventForAgent: jest.fn().mockResolvedValue('gcal-del'),
      deleteEventForAgent: jest.fn().mockResolvedValue(undefined),
    };

    const leads = new InMemoryLeadRepository();
    const lead = await leads.create({
      storeId: STORE,
      name: 'Pedro',
      status: 'new',
      leadSource: 'website',
      interestedPropertyType: 'house',
      purpose: 'buying',
      nextFollowUp: '2026-08-15',
      agentIds: ['agent-x'],
    });

    await syncLeadFollowUpAppointment(appointments, lead, google as never);

    const open = await appointments.findOpenFollowUpByLeadId(STORE, lead.id);
    expect(open?.googleEventId).toBe('gcal-del');

    const cleared = await leads.update(STORE, lead.id, {
      name: 'Pedro',
      status: 'new',
      leadSource: 'website',
      interestedPropertyType: 'house',
      purpose: 'buying',
      nextFollowUp: null,
      agentIds: ['agent-x'],
    });

    await syncLeadFollowUpAppointment(appointments, cleared!, google as never);

    expect(google.deleteEventForAgent).toHaveBeenCalledWith({
      storeId: STORE,
      agentId: 'agent-x',
      googleEventId: 'gcal-del',
    });
    expect(
      await appointments.findOpenFollowUpByLeadId(STORE, lead.id),
    ).toBeNull();
  });
});
