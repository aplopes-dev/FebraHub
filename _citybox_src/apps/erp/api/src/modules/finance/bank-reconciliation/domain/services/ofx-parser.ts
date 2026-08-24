import { parseStrict } from 'ofx-js';
import * as iconv from 'iconv-lite';

/**
 * Função pura — sem Prisma, sem NestJS, sem I/O de rede/banco. `ofx-js` e
 * `iconv-lite` também não fazem I/O; "pura" aqui significa testável com um
 * `Buffer` de entrada e um resultado determinístico, não "zero dependência"
 * (research.md D10).
 */

export type OfxParsedTransaction = {
  /** "" quando ausente no arquivo — ver domain/services/dedupe-key.ts para o fallback. */
  fitId: string;
  postedAt: Date;
  /** Sinal preservado do TRNAMT original (negativo = débito). A conversão
   *  para o par (amountCents sempre positivo, kind) acontece no use case de
   *  importação, não aqui — ver data-model.md §5. */
  amountCents: number;
  /** TRNTYPE cru do OFX (XFER, PAYMENT, FEE, CREDIT, ...), só exibição. */
  transactionType: string;
  memo: string;
};

export type OfxParsedStatement = {
  bankCode: string;
  branchNumber: string;
  accountNumber: string;
  periodStart: Date;
  periodEnd: Date;
  transactions: OfxParsedTransaction[];
};

export class OfxParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OfxParseError';
  }
}

const HEADER_WINDOW_BYTES = 2048;

/**
 * Nenhuma lib de OFX decodifica charset corretamente (research.md D10) — o
 * cabeçalho OFX (SGML `CHARSET:`/`ENCODING:` ou o atributo `encoding=` da
 * declaração XML) é sempre ASCII-safe, então é seguro ler essa janela como
 * `latin1` antes de saber a codificação real do corpo.
 */
function detectCharsetLabel(buffer: Buffer): string {
  const window = buffer
    .subarray(0, Math.min(buffer.length, HEADER_WINDOW_BYTES))
    .toString('latin1');

  const xmlDeclarationMatch = window.match(
    /<\?xml[^>]*encoding=["']([\w-]+)["']/i,
  );
  if (xmlDeclarationMatch) {
    return normalizeCharsetLabel(xmlDeclarationMatch[1]);
  }

  const charsetMatch = window.match(/CHARSET:\s*([\w-]+)/i);
  if (charsetMatch) {
    return normalizeCharsetLabel(charsetMatch[1]);
  }

  const encodingMatch = window.match(/ENCODING:\s*([\w-]+)/i);
  if (encodingMatch && /UTF-?8/i.test(encodingMatch[1])) {
    return 'utf-8';
  }

  // Sem cabeçalho reconhecível — Windows-1252 é o superconjunto mais comum em
  // exportações de bancos brasileiros (cobre ASCII + acentuação Latin-1).
  return 'windows-1252';
}

function normalizeCharsetLabel(label: string): string {
  const normalized = label.trim().toUpperCase();
  if (['1252', 'CP1252', 'WINDOWS-1252'].includes(normalized))
    return 'windows-1252';
  if (['8859-1', 'ISO-8859-1', 'LATIN1'].includes(normalized))
    return 'iso-8859-1';
  if (['UTF-8', 'UTF8'].includes(normalized)) return 'utf-8';
  // USASCII declarado, mas bancos BR frequentemente gravam bytes CP1252 sob
  // esse rótulo — ASCII é subconjunto de CP1252, decodificar como CP1252
  // nunca corrompe um arquivo genuinamente ASCII.
  return 'windows-1252';
}

function requireOfxDate(value: string | undefined, fieldLabel: string): Date {
  const parsed = parseOfxDate(value);
  if (!parsed) {
    throw new OfxParseError(`Campo de data ausente ou inválido: ${fieldLabel}`);
  }
  return parsed;
}

function parseOfxDate(value: string | undefined): Date | null {
  if (!value) return null;
  const match = value.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!match) return null;
  const [, year, month, day] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
}

function parseOfxAmountCents(value: string | undefined): number {
  const amount = Number.parseFloat(value ?? '');
  if (Number.isNaN(amount)) {
    throw new OfxParseError(`Valor de transação inválido: "${value}"`);
  }
  return Math.round(amount * 100);
}

export function parseOfxFile(buffer: Buffer): OfxParsedStatement {
  if (!buffer || buffer.length === 0) {
    throw new OfxParseError('Arquivo OFX vazio');
  }

  const charsetLabel = detectCharsetLabel(buffer);
  const decoded = iconv.decode(buffer, charsetLabel);

  let parsed: ReturnType<typeof parseStrict>;
  try {
    parsed = parseStrict(decoded);
  } catch {
    throw new OfxParseError('Não foi possível ler o arquivo OFX');
  }

  const statementTransactionResponse = parsed.OFX.BANKMSGSRSV1?.STMTTRNRS;
  const singleResponse = Array.isArray(statementTransactionResponse)
    ? statementTransactionResponse[0]
    : statementTransactionResponse;
  const statementResponse = singleResponse?.STMTRS;

  if (!statementResponse || !statementResponse.BANKACCTFROM) {
    throw new OfxParseError(
      'Arquivo OFX não contém um extrato de conta bancária',
    );
  }

  const rawTransactions = statementResponse.BANKTRANLIST?.STMTTRN;
  const transactionList = Array.isArray(rawTransactions)
    ? rawTransactions
    : rawTransactions
      ? [rawTransactions]
      : [];

  return {
    bankCode: statementResponse.BANKACCTFROM.BANKID?.trim() ?? '',
    branchNumber: statementResponse.BANKACCTFROM.BRANCHID?.trim() ?? '',
    accountNumber: statementResponse.BANKACCTFROM.ACCTID?.trim() ?? '',
    periodStart: requireOfxDate(
      statementResponse.BANKTRANLIST?.DTSTART,
      'BANKTRANLIST.DTSTART',
    ),
    periodEnd: requireOfxDate(
      statementResponse.BANKTRANLIST?.DTEND,
      'BANKTRANLIST.DTEND',
    ),
    transactions: transactionList.map((transaction) => ({
      fitId: transaction.FITID?.trim() ?? '',
      postedAt: requireOfxDate(transaction.DTPOSTED, 'STMTTRN.DTPOSTED'),
      amountCents: parseOfxAmountCents(transaction.TRNAMT),
      transactionType: transaction.TRNTYPE ?? '',
      memo: (transaction.MEMO ?? transaction.NAME ?? '').trim(),
    })),
  };
}
