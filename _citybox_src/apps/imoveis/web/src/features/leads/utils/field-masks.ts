/** Máscaras e formatação de campos do formulário de leads (pt-BR). */

/** Mantém só dígitos. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Telefone BR: (00) 0000-0000 ou (00) 00000-0000.
 * Aceita digitação parcial.
 */
export function formatPhoneBR(value: string): string {
  const digits = digitsOnly(value).slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/** Formata inteiro com separador de milhar pt-BR (1.560.400). */
export function formatIntegerBR(digits: string): string {
  if (!digits) return '';
  const normalized = digits.replace(/^0+(?=\d)/, '') || '0';
  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Digitação de orçamento: um ou dois valores em R$ com milhares.
 * Digite números e use "-" para faixa → "R$ 500.000 – R$ 650.000".
 */
export function maskBudgetInput(raw: string): string {
  const chars = raw.replace(/R\$\s?/gi, '');
  let sawSep = false;
  let left = '';
  let right = '';

  for (const char of chars) {
    if (/\d/.test(char)) {
      if (!sawSep) left += char;
      else right += char;
    } else if ((char === '-' || char === '–') && !sawSep && left.length > 0) {
      sawSep = true;
    }
  }

  left = left.slice(0, 12);
  right = right.slice(0, 12);

  if (!left && !sawSep) return '';
  if (!sawSep) return `R$ ${formatIntegerBR(left)}`;
  if (!right) return `R$ ${formatIntegerBR(left)} – `;
  return `R$ ${formatIntegerBR(left)} – R$ ${formatIntegerBR(right)}`;
}

/**
 * Normaliza orçamento ao abrir o formulário (edição/criação com seed).
 * Converte textos com "mil"/"mi" para valores com separador de milhar.
 */
export function normalizeBudgetDisplay(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  if (!/mil|mi\b/i.test(trimmed)) {
    const masked = maskBudgetInput(trimmed);
    return masked || trimmed;
  }

  // Ex.: "R$ 550 mil – 1,6 mi" | "R$ 7 mil – 9 mil / mês"
  const suffix = /\/\s*mês/i.test(trimmed) ? ' / mês' : '';
  const withoutSuffix = trimmed.replace(/\/\s*mês/i, '').trim();
  const chunks = withoutSuffix.split(/\s*[–-]\s*/);

  const toNumber = (chunk: string): number | null => {
    const cleaned = chunk.replace(/R\$/gi, '').trim().toLowerCase();
    if (!cleaned) return null;
    if (cleaned.includes('mi')) {
      const n = Number(cleaned.replace('mi', '').replace(',', '.').trim());
      return Number.isFinite(n) ? Math.round(n * 1_000_000) : null;
    }
    if (cleaned.includes('mil')) {
      const n = Number(cleaned.replace('mil', '').replace(',', '.').trim());
      return Number.isFinite(n) ? Math.round(n * 1_000) : null;
    }
    const digits = digitsOnly(cleaned);
    return digits ? Number(digits) : null;
  };

  const amounts = chunks.map(toNumber).filter((n): n is number => n !== null);
  if (amounts.length === 0) return trimmed;

  const formatted = amounts
    .slice(0, 2)
    .map((n) => `R$ ${formatIntegerBR(String(n))}`)
    .join(' – ');

  return `${formatted}${suffix}`;
}

/** ISO YYYY-MM-DD → DD/MM/YYYY */
export function isoToDisplayDate(iso: string): string {
  if (!iso) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

/** Digitação de data → DD/MM/YYYY */
export function maskDateInput(raw: string): string {
  const digits = digitsOnly(raw).slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** DD/MM/YYYY completo → YYYY-MM-DD ou '' se inválido */
export function displayDateToIso(display: string): string {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(display.trim());
  if (!match) return '';
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return '';
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return '';
  }
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
