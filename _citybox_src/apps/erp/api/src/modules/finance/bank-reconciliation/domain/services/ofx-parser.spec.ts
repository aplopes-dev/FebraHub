import { readFileSync } from 'fs';
import { join } from 'path';
import { parseOfxFile, OfxParseError } from './ofx-parser';

const FIXTURES_DIR = join(__dirname, '..', '..', 'tests', 'fixtures');

function loadFixture(fileName: string): Buffer {
  return readFileSync(join(FIXTURES_DIR, fileName));
}

describe('parseOfxFile', () => {
  it('parseia um OFX 1.x SGML em Windows-1252 preservando acentuação', () => {
    const result = parseOfxFile(loadFixture('sample-1.1x-latin1.ofx'));

    expect(result.bankCode).toBe('001');
    expect(result.branchNumber).toBe('1234');
    expect(result.accountNumber).toBe('567890');
    expect(result.periodStart.toISOString().slice(0, 10)).toBe('2026-07-01');
    expect(result.periodEnd.toISOString().slice(0, 10)).toBe('2026-07-31');
    expect(result.transactions).toHaveLength(2);

    const [credit, debit] = result.transactions;
    expect(credit.fitId).toBe('2026070500001');
    expect(credit.amountCents).toBe(15000);
    expect(credit.memo).toBe('TED RECEBIDA - JOÃO SILVA');
    expect(debit.amountCents).toBe(-4590);
    expect(debit.memo).toBe('PAGAMENTO CONTA DE LUZ - COMPANHIA ELÉTRICA');
  });

  it('parseia um OFX 2.x XML', () => {
    const result = parseOfxFile(loadFixture('sample-2.0x-xml.ofx'));

    expect(result.bankCode).toBe('033');
    expect(result.accountNumber).toBe('112233-4');
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].fitId).toBe('OFX2-0001');
    expect(result.transactions[0].amountCents).toBe(32000);
    expect(result.transactions[0].memo).toBe('REPASSE ADQUIRENTE');
  });

  it('normaliza STMTTRN único (objeto) e múltiplo (array) da mesma forma', () => {
    const single = parseOfxFile(loadFixture('sample-missing-fitid.ofx'));
    expect(Array.isArray(single.transactions)).toBe(true);
    expect(single.transactions).toHaveLength(1);

    const multiple = parseOfxFile(loadFixture('sample-1.1x-latin1.ofx'));
    expect(Array.isArray(multiple.transactions)).toBe(true);
    expect(multiple.transactions).toHaveLength(2);
  });

  it('devolve fitId vazio quando o arquivo não traz FITID', () => {
    const result = parseOfxFile(loadFixture('sample-missing-fitid.ofx'));
    expect(result.transactions[0].fitId).toBe('');
    expect(result.transactions[0].amountCents).toBe(-1250);
  });

  it('lança OfxParseError em arquivo ilegível', () => {
    expect(() => parseOfxFile(loadFixture('corrupted.ofx'))).toThrow(
      OfxParseError,
    );
  });

  it('lança OfxParseError em buffer vazio', () => {
    expect(() => parseOfxFile(Buffer.alloc(0))).toThrow(OfxParseError);
  });
});
