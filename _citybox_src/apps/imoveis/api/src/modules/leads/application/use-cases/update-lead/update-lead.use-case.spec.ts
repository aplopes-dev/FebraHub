import { UpdateLeadUseCase } from './update-lead.use-case';
import { LeadNotFoundError } from '../../../domain/errors/lead-not-found.error';
import { InMemoryLeadRepository } from '../../../infrastructure/database/in-memory-lead.repository';
import { InMemoryAppointmentRepository } from '../../../../appointments/infrastructure/database/in-memory-appointment.repository';
import {
  makeCreateLeadUseCase,
  makeUpdateLeadUseCase,
} from '../shared/lead-use-case-test-fixtures';

const STORE = 'store-1';

describe('UpdateLeadUseCase', () => {
  async function seed() {
    const repo = new InMemoryLeadRepository();
    const appointments = new InMemoryAppointmentRepository();
    const created = await makeCreateLeadUseCase(repo, appointments).execute({
      storeId: STORE,
      name: 'Ana Silva',
      email: 'ana@example.com',
      status: 'new',
      leadSource: 'website',
      interestedPropertyType: 'apartment',
      purpose: 'buying',
      agentIds: ['agent-1'],
    });
    return { repo, appointments, id: created.id };
  }

  it('atualiza campos e relações', async () => {
    const { repo, appointments, id } = await seed();
    const useCase = makeUpdateLeadUseCase(repo, appointments);

    const updated = await useCase.execute({
      storeId: STORE,
      id,
      name: 'Ana Costa',
      email: 'ana.costa@example.com',
      status: 'negotiating',
      leadSource: 'referral',
      interestedPropertyType: 'house',
      purpose: 'renting',
      notes: 'Atualizado',
      agentIds: ['agent-2'],
      matchedProperties: [{ id: 'prop-9', name: 'Casa Praia' }],
      documents: [
        { name: 'Contrato.pdf', sizeLabel: '80 KB', addedAt: '2026-07-29' },
      ],
      activities: [{ type: 'note', message: 'Follow-up', authorName: 'Você' }],
    });

    expect(updated.name).toBe('Ana Costa');
    expect(updated.email).toBe('ana.costa@example.com');
    expect(updated.status).toBe('negotiating');
    expect(updated.leadSource).toBe('referral');
    expect(updated.purpose).toBe('renting');
    expect(updated.notes).toBe('Atualizado');
    expect(updated.agentIds).toEqual(['agent-2']);
    expect(updated.matchedProperties).toEqual([
      expect.objectContaining({
        propertyId: 'prop-9',
        propertyName: 'Casa Praia',
      }),
    ]);
    expect(updated.documents[0]?.name).toBe('Contrato.pdf');
    expect(updated.activities.some((a) => a.message === 'Follow-up')).toBe(
      true,
    );
    expect(updated.paymentIntents).toEqual([]);
  });

  it('atualiza intenções de pagamento', async () => {
    const { repo, appointments, id } = await seed();
    const useCase = makeUpdateLeadUseCase(repo, appointments);

    const updated = await useCase.execute({
      storeId: STORE,
      id,
      name: 'Ana Silva',
      status: 'new',
      leadSource: 'website',
      interestedPropertyType: 'apartment',
      purpose: 'buying',
      paymentIntents: ['cash', 'trade-in'],
    });

    expect(updated.paymentIntents).toEqual(['cash', 'trade-in']);
  });

  it('sincroniza compromisso na agenda ao definir próximo follow-up', async () => {
    const { repo, appointments, id } = await seed();
    const useCase = makeUpdateLeadUseCase(repo, appointments);

    await useCase.execute({
      storeId: STORE,
      id,
      name: 'Ana Silva',
      status: 'new',
      leadSource: 'website',
      interestedPropertyType: 'apartment',
      purpose: 'buying',
      nextFollowUp: '2026-08-15',
      notes: 'Enviar proposta',
      agentIds: ['agent-1'],
    });

    const appt = await appointments.findOpenFollowUpByLeadId(STORE, id);
    expect(appt).not.toBeNull();
    expect(appt!.title).toBe('Ana Silva');
    expect(appt!.description).toBe('Enviar proposta');
    expect(appt!.agentId).toBe('agent-1');
  });

  it('404 quando lead não existe', async () => {
    const repo = new InMemoryLeadRepository();
    const appointments = new InMemoryAppointmentRepository();
    const useCase = makeUpdateLeadUseCase(repo, appointments);

    await expect(
      useCase.execute({
        storeId: STORE,
        id: 'missing',
        name: 'X',
        status: 'new',
        leadSource: 'website',
        interestedPropertyType: 'apartment',
        purpose: 'buying',
      }),
    ).rejects.toBeInstanceOf(LeadNotFoundError);
  });
});
