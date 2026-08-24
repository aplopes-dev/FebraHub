import { buildMergeSnapshot } from './build-merge-snapshot';
import { emptyMergeSnapshot } from './document-variable-catalog';
import { LeadEntity } from '../../../leads/domain/entities/lead.entity';

describe('buildMergeSnapshot', () => {
  it('preenche lead e data de hoje a partir da entidade', () => {
    const now = new Date('2026-08-19T15:00:00.000Z');
    const lead = LeadEntity.create(
      {
        storeId: 'store-1',
        name: 'Ana Silva',
        email: 'ana@ex.com',
        phone: '(73) 99999-0000',
        city: 'Ilhéus',
        state: 'BA',
        status: 'new',
        leadSource: 'website',
        interestedPropertyType: 'apartment',
        budgetRange: '',
        preferredLocation: '',
        purpose: 'buying',
        latestFollowUp: null,
        nextFollowUp: null,
        notes: '',
        photoUrl: null,
        propertyName: 'Apt Centro',
        hasSuggestion: false,
        agentId: 'agent-1',
        agentIds: ['agent-1'],
        matchedProperties: [],
        documents: [],
        activities: [],
        createdAt: now,
        updatedAt: now,
      },
      'lead-1',
    );

    const snapshot = buildMergeSnapshot({ lead, now });

    expect(snapshot.lead.nome).toBe('Ana Silva');
    expect(snapshot.lead.cidade).toBe('Ilhéus, BA');
    expect(snapshot.imovel.titulo).toBe('Apt Centro');
    expect(snapshot.data.hoje).toMatch(/\d{2}\/\d{2}\/2026/);
    expect(snapshot.corretor).toEqual(emptyMergeSnapshot().corretor);
  });
});
