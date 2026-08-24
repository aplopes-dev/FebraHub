import { isPrismaTableMissingError } from './is-prisma-table-missing-error';

describe('isPrismaTableMissingError', () => {
  it('detects Prisma P2021', () => {
    expect(isPrismaTableMissingError({ code: 'P2021' })).toBe(true);
  });

  it('ignores other errors', () => {
    expect(isPrismaTableMissingError({ code: 'P2022' })).toBe(false);
    expect(isPrismaTableMissingError(new Error('boom'))).toBe(false);
    expect(isPrismaTableMissingError(null)).toBe(false);
  });
});
