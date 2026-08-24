import { parseRolesParam } from './list-users.query';

describe('parseRolesParam', () => {
  it('parses comma-separated roles', () => {
    expect(parseRolesParam('platform_admin,platform_operator')).toEqual([
      'platform_admin',
      'platform_operator',
    ]);
  });

  it('parses single role', () => {
    expect(parseRolesParam('platform_admin')).toEqual(['platform_admin']);
  });

  it('parses array roles from query parser', () => {
    expect(parseRolesParam(['platform_admin'])).toEqual(['platform_admin']);
  });

  it('returns undefined for empty input', () => {
    expect(parseRolesParam(undefined)).toBeUndefined();
    expect(parseRolesParam('')).toBeUndefined();
  });
});
