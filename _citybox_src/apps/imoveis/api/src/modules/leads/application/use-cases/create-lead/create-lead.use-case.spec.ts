import { InMemoryLeadRepository } from '../../../infrastructure/database/in-memory-lead.repository';
import { InMemoryAppointmentRepository } from '../../../../appointments/infrastructure/database/in-memory-appointment.repository';
import { InMemoryDealRepository } from '../../../../deals/infrastructure/database/in-memory-deal.repository';
import { makeCreateLeadUseCase } from '../shared/lead-use-case-test-fixtures';

const STORE = 'store-1';

const validInput = {
  storeId: STORE,
  name: 'Ana Silva',
  email: 'ana@example.com',
  phone: '(73) 99999-0000',
  status: 'new' as const,
  leadSource: 'website' as const,
  interestedPropertyType: 'apartment' as const,
  budgetRange: 'R$ 500.000',
  preferredLocation: 'Centro',
  purpose: 'buying' as const,
  latestFollowUp: '2026-07-20',
  nextFollowUp: '2026-07-28',
  notes: 'Interessada em 2 quartos',
  agentIds: ['agent-1'],
  matchedProperties: [{ id: 'prop-1', name: 'Apt Centro' }],
  documents: [
    {
      name: 'RG.pdf',
      sizeLabel: '120 KB',
      addedAt: '2026-07-20',
    },
  ],
  activities: [
    {
      type: 'note',
      message: 'Primeiro contato',
      authorName: 'Você',
    },
  ],
};

describe('CreateLeadUseCase', () => {
  it('cria lead com relações (properties, documents, activities, agents)', async () => {
    const repo = new InMemoryLeadRepository();
    const appointments = new InMemoryAppointmentRepository();
    const deals = new InMemoryDealRepository();
    const useCase = makeCreateLeadUseCase(repo, appointments, deals);

    const result = await useCase.execute(validInput);

    expect(result.name).toBe('Ana Silva');
    expect(result.status).toBe('new');
    expect(result.agentIds).toEqual(['agent-1']);
    expect(result.matchedProperties).toEqual([
      expect.objectContaining({
        propertyId: 'prop-1',
        propertyName: 'Apt Centro',
      }),
    ]);
    expect(result.documents).toHaveLength(1);
    expect(result.documents[0]?.name).toBe('RG.pdf');
    expect(result.activities.some((a) => a.type === 'system')).toBe(true);
    expect(
      result.activities.some((a) => a.message === 'Primeiro contato'),
    ).toBe(true);

    const stored = await repo.findById(STORE, result.id);
    expect(stored).not.toBeNull();

    const appt = await appointments.findOpenFollowUpByLeadId(STORE, result.id);
    expect(appt).not.toBeNull();
    expect(appt!.title).toBe('Ana Silva');
    expect(appt!.kind).toBe('follow-up');

    const activeDeal = await deals.findActiveByLeadId(STORE, result.id);
    expect(activeDeal).not.toBeNull();
    expect(activeDeal!.stage).toBe('property_selected');
    expect(result.paymentIntents).toEqual([]);
  });

  it('grava intenções de pagamento quando informadas', async () => {
    const repo = new InMemoryLeadRepository();
    const useCase = makeCreateLeadUseCase(repo);

    const result = await useCase.execute({
      ...validInput,
      paymentIntents: ['financing', 'fgts'],
    });

    expect(result.paymentIntents).toEqual(['financing', 'fgts']);
  });
});
