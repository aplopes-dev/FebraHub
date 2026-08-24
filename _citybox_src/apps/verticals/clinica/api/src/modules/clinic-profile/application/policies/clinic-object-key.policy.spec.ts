import { ClinicObjectKeyPolicy } from './clinic-object-key.policy';

describe('ClinicObjectKeyPolicy', () => {
  const storeId = '11111111-1111-4111-8111-111111111111';

  it('generates logo key with correct extension', () => {
    expect(ClinicObjectKeyPolicy.logoKey(storeId, 'image/jpeg')).toBe(
      `${storeId}/clinic-logo.jpg`,
    );

    expect(ClinicObjectKeyPolicy.logoKey(storeId, 'image/png')).toBe(
      `${storeId}/clinic-logo.png`,
    );

    expect(ClinicObjectKeyPolicy.logoKey(storeId, 'image/webp')).toBe(
      `${storeId}/clinic-logo.webp`,
    );
  });
});
