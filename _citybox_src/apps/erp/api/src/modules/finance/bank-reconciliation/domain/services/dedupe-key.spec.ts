import { computeDedupeKey } from './dedupe-key';

const BANK_CODE = '341';
const ACCOUNT_NUMBER = '567890';

describe('computeDedupeKey', () => {
  it('usa o fitId namespaceado por banco+conta quando presente', () => {
    const key = computeDedupeKey({
      bankCode: BANK_CODE,
      accountNumber: ACCOUNT_NUMBER,
      fitId: '2026070500001',
      postedAt: new Date('2026-07-05T00:00:00.000Z'),
      amountCents: 15000,
      memo: 'TED RECEBIDA',
    });
    expect(key).toBe('341:567890:2026070500001');
  });

  it('ignora espaços em volta do fitId', () => {
    const key = computeDedupeKey({
      bankCode: BANK_CODE,
      accountNumber: ACCOUNT_NUMBER,
      fitId: '  2026070500001  ',
      postedAt: new Date('2026-07-05T00:00:00.000Z'),
      amountCents: 15000,
      memo: 'TED RECEBIDA',
    });
    expect(key).toBe('341:567890:2026070500001');
  });

  it('produz chaves diferentes para o mesmo fitId em bancos/contas diferentes (dedupe organization-wide, 007)', () => {
    const base = {
      fitId: '2026070500001',
      postedAt: new Date('2026-07-05T00:00:00.000Z'),
      amountCents: 15000,
      memo: 'TED RECEBIDA',
    };
    const accountA = computeDedupeKey({
      ...base,
      bankCode: BANK_CODE,
      accountNumber: ACCOUNT_NUMBER,
    });
    const accountB = computeDedupeKey({
      ...base,
      bankCode: BANK_CODE,
      accountNumber: '999999',
    });
    expect(accountA).not.toBe(accountB);
  });

  it('deriva um hash determinístico quando fitId vem vazio', () => {
    const input = {
      bankCode: BANK_CODE,
      accountNumber: ACCOUNT_NUMBER,
      fitId: '',
      postedAt: new Date('2026-07-15T00:00:00.000Z'),
      amountCents: -1250,
      memo: 'TARIFA DE MANUTENCAO DE CONTA',
    };
    const first = computeDedupeKey(input);
    const second = computeDedupeKey({ ...input });

    expect(first).toBe(second);
    expect(first).not.toBe('');
    expect(first).toHaveLength(40); // sha1 hex
  });

  it('produz hashes diferentes para transações diferentes sem fitId', () => {
    const base = {
      bankCode: BANK_CODE,
      accountNumber: ACCOUNT_NUMBER,
      fitId: '',
      postedAt: new Date('2026-07-15T00:00:00.000Z'),
      amountCents: -1250,
      memo: 'TARIFA',
    };
    const other = computeDedupeKey({ ...base, amountCents: -1300 });
    expect(computeDedupeKey(base)).not.toBe(other);
  });

  it('normaliza maiúsculas/minúsculas e espaços do memo no fallback', () => {
    const a = computeDedupeKey({
      bankCode: BANK_CODE,
      accountNumber: ACCOUNT_NUMBER,
      fitId: '',
      postedAt: new Date('2026-07-15T00:00:00.000Z'),
      amountCents: -1250,
      memo: 'Tarifa de Manutenção  ',
    });
    const b = computeDedupeKey({
      bankCode: BANK_CODE,
      accountNumber: ACCOUNT_NUMBER,
      fitId: '',
      postedAt: new Date('2026-07-15T00:00:00.000Z'),
      amountCents: -1250,
      memo: 'tarifa de manutenção',
    });
    expect(a).toBe(b);
  });
});
