import { randomUUID } from 'crypto';
import { Certificate } from '../../../../domain/entities/certificate.entity';
import { toCertificateResponse } from './certificate-response.mapper';

/// FR-007 — regressão: a resposta HTTP nunca pode incluir
/// `encryptedPassword`/`encryptedPfxObjectKey` (nem nada derivado deles).
describe('toCertificateResponse', () => {
  it('never includes encryptedPassword or encryptedPfxObjectKey', () => {
    const certificate = Certificate.with(
      {
        companyId: randomUUID(),
        type: 'A1',
        name: 'Certificado Principal',
        encryptedPfxObjectKey: 'company-1/certificates/secret-key.pfx.enc',
        encryptedPassword: 'iv.tag.ciphertext-super-secret',
        subjectCnpj: '11222333000181',
        validFrom: new Date(),
        validUntil: new Date(),
        status: 'VALID',
        createdAt: new Date(),
      },
      randomUUID(),
    );

    const response = toCertificateResponse(certificate);

    expect(response).not.toHaveProperty('encryptedPassword');
    expect(response).not.toHaveProperty('encryptedPfxObjectKey');
    expect(JSON.stringify(response)).not.toContain('secret');
  });
});
