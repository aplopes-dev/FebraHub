import {
  buildTransactionDocumentChecklist,
  dedupePackDocuments,
  type TransactionPackDocument,
} from './transaction-document-checklist.policy';

function doc(
  overrides: Partial<TransactionPackDocument> & Pick<TransactionPackDocument, 'id'>,
): TransactionPackDocument {
  return {
    name: 'arquivo.pdf',
    sizeLabel: '10 KB',
    kind: 'other',
    source: 'lead',
    sentAt: null,
    sentChannel: null,
    objectKey: overrides.id,
    ...overrides,
  };
}

describe('buildTransactionDocumentChecklist', () => {
  it('marca contrato como enviado quando há sentAt', () => {
    const items = [
      doc({
        id: 'c1',
        kind: 'contract',
        sentAt: new Date('2026-08-20T12:00:00.000Z'),
        sentChannel: 'whatsapp',
      }),
    ];
    const checklist = buildTransactionDocumentChecklist('SALE', items, 0);
    expect(checklist.find((i) => i.id === 'contract')?.status).toBe('sent');
    expect(checklist.some((i) => i.id === 'property')).toBe(false);
  });

  it('locação pede anexos do locatário', () => {
    const checklist = buildTransactionDocumentChecklist('RENTAL', [], 0);
    expect(checklist.find((i) => i.id === 'client')?.label).toBe(
      'Anexos do locatário',
    );
    expect(checklist.find((i) => i.id === 'client')?.status).toBe('pending');
  });

  it('documentos do imóvel ficam anexados quando source=property', () => {
    const items = [doc({ id: 'p1', source: 'property' })];
    const checklist = buildTransactionDocumentChecklist('SALE', items, 1);
    expect(checklist.find((i) => i.id === 'property')?.status).toBe('attached');
  });
});

describe('dedupePackDocuments', () => {
  it('mantém o primeiro documento com o mesmo objectKey', () => {
    const items = [
      doc({ id: 'lead-1', source: 'lead', objectKey: 'same-key', kind: 'contract' }),
      doc({ id: 'prop-1', source: 'property', objectKey: 'same-key' }),
    ];
    const unique = dedupePackDocuments(items);
    expect(unique).toHaveLength(1);
    expect(unique[0]?.source).toBe('lead');
  });
});
