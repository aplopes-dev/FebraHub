export type ReconciliationImportRow = {
  externalReference?: string;
  providerReference?: string;
  amount: number;
  transactionDate?: string;
  description?: string;
};

export function parseReconciliationCsv(text: string): ReconciliationImportRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const header = lines[0]!.split(',').map((cell) => cell.trim().toLowerCase());
  const rows = lines.slice(1);

  return rows.map((line) => {
    const cells = line.split(',').map((cell) => cell.trim());
    const record: Record<string, string> = {};
    header.forEach((key, index) => {
      record[key] = cells[index] ?? '';
    });

    const amountRaw = record.amount ?? record.valor ?? record.value ?? '0';
    const amount = Number(amountRaw.replace(',', '.'));

    return {
      externalReference:
        record.externalreference ??
        record.external_reference ??
        record.referencia ??
        record.reference,
      providerReference:
        record.providerreference ??
        record.provider_reference ??
        record.provider_id,
      amount: Number.isFinite(amount) ? amount : 0,
      transactionDate:
        record.transactiondate ??
        record.transaction_date ??
        record.date ??
        record.data,
      description: record.description ?? record.descricao,
    };
  });
}

export function reconciliationItemsToCsv(
  items: Array<{
    id: string;
    externalReference: string | null;
    providerReference: string | null;
    amount: number;
    expectedAmount: number | null;
    differenceAmount: number | null;
    status: string;
    transactionDate: string | null;
    matchNotes: string | null;
  }>,
): string {
  const header = [
    'id',
    'externalReference',
    'providerReference',
    'amount',
    'expectedAmount',
    'differenceAmount',
    'status',
    'transactionDate',
    'matchNotes',
  ];
  const lines = [header.join(',')];
  for (const item of items) {
    lines.push(
      [
        item.id,
        item.externalReference ?? '',
        item.providerReference ?? '',
        item.amount.toFixed(2),
        item.expectedAmount?.toFixed(2) ?? '',
        item.differenceAmount?.toFixed(2) ?? '',
        item.status,
        item.transactionDate ?? '',
        (item.matchNotes ?? '').replace(/,/g, ';'),
      ].join(','),
    );
  }
  return lines.join('\n');
}
