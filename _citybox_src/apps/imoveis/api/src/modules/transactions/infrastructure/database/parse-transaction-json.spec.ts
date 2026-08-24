import { toCommissionOthers, toRentalDeductions } from './parse-transaction-json';

describe('parse-transaction-json', () => {
  it('maps valid commission others from Prisma Json', () => {
    expect(
      toCommissionOthers([
        { label: 'Portal', percent: 10, amountCents: 1000 },
        null,
        'skip',
      ]),
    ).toEqual([{ label: 'Portal', percent: 10, amountCents: 1000 }]);
  });

  it('returns empty when value is not an array', () => {
    expect(toCommissionOthers(null)).toEqual([]);
    expect(toRentalDeductions({ label: 'x' })).toEqual([]);
  });

  it('maps valid rental deductions from Prisma Json', () => {
    expect(
      toRentalDeductions([
        { label: 'Condomínio', amountCents: 35000 },
        { label: 1, amountCents: 10 },
      ]),
    ).toEqual([{ label: 'Condomínio', amountCents: 35000 }]);
  });
});
