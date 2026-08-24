import { randomBytes } from 'crypto';
import { InMemoryObjectStorage } from '../../storage/in-memory-object-storage';
import { encryptBinary, encryptSecret } from '../cert-encryption';
import { loadCertificateKeyMaterial } from '../certificate-key-loader';
import { buildSelfSignedCertificateFixture } from './fixtures/self-signed-certificate';

describe('loadCertificateKeyMaterial', () => {
  const originalKey = process.env.FISCAL_CERT_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.FISCAL_CERT_ENCRYPTION_KEY = randomBytes(32).toString('base64');
  });

  afterEach(() => {
    process.env.FISCAL_CERT_ENCRYPTION_KEY = originalKey;
  });

  it('decrypts the stored .pfx and password, returning usable PEM key material', async () => {
    const fixture = buildSelfSignedCertificateFixture();
    const objectStorage = new InMemoryObjectStorage();
    const pfxObjectKey = 'company-1/certificates/cert.pfx.enc';
    await objectStorage.put({
      key: pfxObjectKey,
      buffer: Buffer.from(encryptBinary(fixture.pfxBuffer), 'utf-8'),
      mimeType: 'text/plain',
    });

    const result = await loadCertificateKeyMaterial(objectStorage, {
      encryptedPfxObjectKey: pfxObjectKey,
      encryptedPassword: encryptSecret(fixture.password),
    });

    expect(result.privateKeyPem).toContain('BEGIN RSA PRIVATE KEY');
    expect(result.certificatePem).toContain('BEGIN CERTIFICATE');
  });

  it('rejects when the object does not exist in storage', async () => {
    const objectStorage = new InMemoryObjectStorage();

    await expect(
      loadCertificateKeyMaterial(objectStorage, {
        encryptedPfxObjectKey: 'missing/key',
        encryptedPassword: encryptSecret('whatever'),
      }),
    ).rejects.toThrow();
  });
});
