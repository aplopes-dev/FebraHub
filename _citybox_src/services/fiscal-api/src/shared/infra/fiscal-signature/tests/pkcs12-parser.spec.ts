import { parsePkcs12 } from '../pkcs12-parser';
import { Pkcs12ParseError } from '../errors/pkcs12-parse.error';
import { buildSelfSignedCertificateFixture } from './fixtures/self-signed-certificate';

describe('parsePkcs12', () => {
  it('extracts the private key, certificate and CNPJ from a valid .pfx', () => {
    const fixture = buildSelfSignedCertificateFixture({
      cnpj: '11222333000181',
    });

    const result = parsePkcs12(fixture.pfxBuffer, fixture.password);

    expect(result.subjectCnpj).toBe('11222333000181');
    expect(result.privateKeyPem).toContain('BEGIN');
    expect(result.certificatePem).toContain('BEGIN CERTIFICATE');
    expect(result.validFrom.getTime()).toBeLessThan(Date.now());
    expect(result.validUntil.getTime()).toBeGreaterThan(Date.now());
  });

  it('throws Pkcs12ParseError for the wrong password', () => {
    const fixture = buildSelfSignedCertificateFixture({
      password: 'correct-password',
    });

    expect(() => parsePkcs12(fixture.pfxBuffer, 'wrong-password')).toThrow(
      Pkcs12ParseError,
    );
  });

  it('throws Pkcs12ParseError for a file that is not PKCS#12', () => {
    const notAPfx = Buffer.from('this is definitely not a pfx file');

    expect(() => parsePkcs12(notAPfx, 'any-password')).toThrow(
      Pkcs12ParseError,
    );
  });

  it('throws Pkcs12ParseError for an expired certificate', () => {
    const fixture = buildSelfSignedCertificateFixture({ validityDays: -1 });

    expect(() => parsePkcs12(fixture.pfxBuffer, fixture.password)).toThrow(
      Pkcs12ParseError,
    );
  });

  it('never exposes the raw password in the parsed result', () => {
    const fixture = buildSelfSignedCertificateFixture({
      password: 'super-secret-password',
    });

    const result = parsePkcs12(fixture.pfxBuffer, fixture.password);

    expect(JSON.stringify(result)).not.toContain('super-secret-password');
  });
});
