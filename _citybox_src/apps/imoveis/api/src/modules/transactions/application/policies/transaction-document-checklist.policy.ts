export type TransactionDocumentSource = 'lead' | 'property';

export type TransactionPackDocument = {
  id: string;
  name: string;
  sizeLabel: string;
  kind: 'contract' | 'other';
  source: TransactionDocumentSource;
  sentAt: Date | null;
  sentChannel: 'whatsapp' | 'share' | 'link' | null;
  path?: string;
  objectKey: string | null;
};

export type ChecklistStatus = 'pending' | 'attached' | 'sent';

export type TransactionDocumentChecklistItem = {
  id: 'contract' | 'property' | 'client';
  label: string;
  status: ChecklistStatus;
};

function contractStatus(
  items: readonly TransactionPackDocument[],
): ChecklistStatus {
  const contracts = items.filter((item) => item.kind === 'contract');
  if (contracts.length === 0) return 'pending';
  if (contracts.some((item) => item.sentAt)) return 'sent';
  return 'attached';
}

function propertyStatus(
  items: readonly TransactionPackDocument[],
  propertyDocumentCount: number,
  propertyObjectKeys: ReadonlySet<string>,
): ChecklistStatus | null {
  if (propertyDocumentCount <= 0) return null;
  const reused = items.some(
    (item) =>
      item.source === 'property' ||
      (item.objectKey != null && propertyObjectKeys.has(item.objectKey)),
  );
  return reused ? 'attached' : 'pending';
}

function clientStatus(
  items: readonly TransactionPackDocument[],
): ChecklistStatus {
  const others = items.filter(
    (item) => item.kind === 'other' && item.source === 'lead',
  );
  return others.length > 0 ? 'attached' : 'pending';
}

export function buildTransactionDocumentChecklist(
  type: 'SALE' | 'RENTAL',
  items: readonly TransactionPackDocument[],
  propertyDocumentCount: number,
  propertyObjectKeys: ReadonlySet<string> = new Set(),
): TransactionDocumentChecklistItem[] {
  const checklist: TransactionDocumentChecklistItem[] = [
    {
      id: 'contract',
      label: 'Contrato',
      status: contractStatus(items),
    },
  ];

  const property = propertyStatus(
    items,
    propertyDocumentCount,
    propertyObjectKeys,
  );
  if (property) {
    checklist.push({
      id: 'property',
      label: 'Documentos do imóvel',
      status: property,
    });
  }

  checklist.push({
    id: 'client',
    label: type === 'RENTAL' ? 'Anexos do locatário' : 'Anexos do cliente',
    status: clientStatus(items),
  });

  return checklist;
}

export function dedupePackDocuments(
  items: readonly TransactionPackDocument[],
): TransactionPackDocument[] {
  const seen = new Set<string>();
  const result: TransactionPackDocument[] = [];
  for (const item of items) {
    const key = item.objectKey?.trim();
    if (key) {
      if (seen.has(key)) continue;
      seen.add(key);
    }
    result.push(item);
  }
  return result;
}
