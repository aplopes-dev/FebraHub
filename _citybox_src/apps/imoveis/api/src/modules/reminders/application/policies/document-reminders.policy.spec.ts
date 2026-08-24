import { LeadEntity } from '../../../leads/domain/entities/lead.entity';
import { buildDocumentReminders } from './document-reminders.policy';

function makeLead(
  overrides: Partial<{
    id: string;
    name: string;
    documents: LeadEntity['documents'];
  }> = {},
): LeadEntity {
  return LeadEntity.create({
    storeId: 's1',
    name: overrides.name ?? 'Ana',
    email: '',
    phone: '',
    city: '',
    state: '',
    status: 'negotiating',
    leadSource: 'website',
    interestedPropertyType: 'house',
    budgetRange: '',
    preferredLocation: '',
    purpose: 'buying',
    paymentIntents: [],
    latestFollowUp: null,
    nextFollowUp: null,
    notes: '',
    photoUrl: null,
    propertyName: null,
    hasSuggestion: false,
    agentId: null,
    agentIds: [],
    matchedProperties: [],
    documents: overrides.documents ?? [],
    activities: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }, overrides.id ?? 'lead-1');
}

describe('buildDocumentReminders', () => {
  const now = new Date('2026-08-21T12:00:00.000Z');

  it('alerta contrato anexado e não enviado', () => {
    const lead = makeLead({
      documents: [
        {
          id: 'd1',
          name: 'Contrato.pdf',
          sizeLabel: '10 KB',
          kind: 'contract',
          addedAt: now,
          objectKey: 'key',
          mimeType: 'application/pdf',
          sentAt: null,
          sentChannel: null,
          shareToken: null,
          shareExpiresAt: null,
          viewedAt: null,
        },
      ],
    });
    const reminders = buildDocumentReminders([lead], new Map(), now);
    expect(reminders).toHaveLength(1);
    expect(reminders[0]?.title).toBe('Contrato sem envio');
    expect(reminders[0]?.href).toContain('/leads/lead-1');
  });

  it('alerta contrato enviado há mais de 3 dias sem assinatura', () => {
    const sentAt = new Date('2026-08-16T12:00:00.000Z');
    const lead = makeLead({
      documents: [
        {
          id: 'd1',
          name: 'Contrato.pdf',
          sizeLabel: '10 KB',
          kind: 'contract',
          addedAt: sentAt,
          objectKey: 'key',
          mimeType: 'application/pdf',
          sentAt,
          sentChannel: 'whatsapp',
          shareToken: 'tok',
          shareExpiresAt: new Date('2026-08-18T12:00:00.000Z'),
          viewedAt: null,
        },
      ],
    });
    const reminders = buildDocumentReminders(
      [lead],
      new Map([['lead-1', 'contract_sent']]),
      now,
    );
    expect(reminders.some((r) => r.title === 'Contrato sem assinatura')).toBe(
      true,
    );
  });

  it('não alerta se o negócio já está em contrato assinado', () => {
    const sentAt = new Date('2026-08-01T12:00:00.000Z');
    const lead = makeLead({
      documents: [
        {
          id: 'd1',
          name: 'Contrato.pdf',
          sizeLabel: '10 KB',
          kind: 'contract',
          addedAt: sentAt,
          objectKey: 'key',
          mimeType: 'application/pdf',
          sentAt,
          sentChannel: 'whatsapp',
          shareToken: 'tok',
          shareExpiresAt: sentAt,
          viewedAt: null,
        },
      ],
    });
    const reminders = buildDocumentReminders(
      [lead],
      new Map([['lead-1', 'contract_signed']]),
      now,
    );
    expect(reminders).toEqual([]);
  });
});
