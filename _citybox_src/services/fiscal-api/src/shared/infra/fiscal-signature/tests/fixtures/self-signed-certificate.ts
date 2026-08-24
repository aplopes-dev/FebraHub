import * as forge from 'node-forge';

export type SelfSignedFixture = {
  pfxBuffer: Buffer;
  password: string;
  cnpj: string;
  privateKeyPem: string;
  certificatePem: string;
};

/// Gera um par de chaves RSA + certificado X.509 autoassinado + PKCS#12 em
/// memória, só para testes — nunca usado fora de `*.spec.ts`. Embute um CNPJ
/// no CN seguindo o padrão ICP-Brasil e-CNPJ ("RAZÃO:14DIGITOS") para exercitar
/// `extractCnpjFromCommonName` em `pkcs12-parser.ts`.
export function buildSelfSignedCertificateFixture(
  overrides: { cnpj?: string; password?: string; validityDays?: number } = {},
): SelfSignedFixture {
  const cnpj = overrides.cnpj ?? '11222333000181';
  const password = overrides.password ?? 'test-password-123';
  const validityDays = overrides.validityDays ?? 365;

  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notBefore.setDate(cert.validity.notBefore.getDate() - 1);
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setDate(
    cert.validity.notAfter.getDate() + validityDays,
  );

  const attrs = [{ name: 'commonName', value: `EMPRESA TESTE LTDA:${cnpj}` }];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey, forge.md.sha256.create());

  const p12Asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, cert, password, {
    algorithm: '3des',
  });
  const p12Der = forge.asn1.toDer(p12Asn1).getBytes();

  return {
    pfxBuffer: Buffer.from(p12Der, 'binary'),
    password,
    cnpj,
    privateKeyPem: forge.pki.privateKeyToPem(keys.privateKey),
    certificatePem: forge.pki.certificateToPem(cert),
  };
}
