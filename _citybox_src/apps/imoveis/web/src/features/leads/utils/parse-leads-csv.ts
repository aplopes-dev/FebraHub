/**
 * Parse simples de CSV (UTF-8). Suporta campos entre aspas com vírgula/escapados.
 * Não depende de PapaParse.
 */

export type ImportedLeadRow = {
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
};

const HEADER_ALIASES: Record<keyof ImportedLeadRow, readonly string[]> = {
  name: ['name', 'nome'],
  phone: ['phone', 'telefone', 'celular'],
  email: ['email', 'e-mail'],
  notes: ['notes', 'notas', 'observacoes', 'observações', 'obs'],
};

export function parseLeadsCsv(text: string): ImportedLeadRow[] {
  const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n').filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  const headerCells = splitCsvLine(lines[0]!).map((h) =>
    h.trim().toLowerCase().replace(/\s+/g, ''),
  );
  const index = resolveHeaderIndexes(headerCells);

  const rows: ImportedLeadRow[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cells = splitCsvLine(lines[i]!);
    const name = cellAt(cells, index.name).trim();
    if (!name) continue;
    const phone = cellAt(cells, index.phone).trim();
    const email = cellAt(cells, index.email).trim();
    const notes = cellAt(cells, index.notes).trim();
    rows.push({
      name,
      ...(phone ? { phone } : {}),
      ...(email ? { email } : {}),
      ...(notes ? { notes } : {}),
    });
  }
  return rows;
}

export function buildLeadsTemplateCsv(): string {
  const headers = ['name', 'phone', 'email', 'notes'];
  const example = ['Maria Silva', '(73) 99999-0000', 'maria@email.com', 'Interessada em 2 quartos'];
  return `\uFEFF${[headers.join(','), example.map(escape).join(',')].join('\n')}`;
}

export function downloadLeadsTemplateCsv(): void {
  const csv = buildLeadsTemplateCsv();
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'leads_modelo.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function resolveHeaderIndexes(
  headers: string[],
): Record<keyof ImportedLeadRow, number> {
  const find = (aliases: readonly string[]): number => {
    for (const alias of aliases) {
      const i = headers.indexOf(alias.replace(/\s+/g, ''));
      if (i >= 0) return i;
    }
    return -1;
  };
  return {
    name: find(HEADER_ALIASES.name),
    phone: find(HEADER_ALIASES.phone),
    email: find(HEADER_ALIASES.email),
    notes: find(HEADER_ALIASES.notes),
  };
}

function cellAt(cells: string[], index: number): string {
  if (index < 0) return '';
  return cells[index] ?? '';
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ',') {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

function escape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
