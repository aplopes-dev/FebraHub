import * as forge from 'node-forge';
import { Pkcs12ParseError } from './errors/pkcs12-parse.error';

export type ParsedCertificate = {
  privateKeyPem: string;
  certificatePem: string;
  /// Extraído do CN do certificado (formato ICP-Brasil e-CNPJ "RAZÃO:14DIGITOS") —
  /// best-effort; a validação contra `Company.cnpj` é responsabilidade do
  /// caso de uso de upload (US3), não deste parser.
  subjectCnpj: string | null;
  subjectCommonName: string | null;
  validFrom: Date;
  validUntil: Date;
};

/// Certificados e-CNPJ ICP-Brasil seguem o padrão de CN "RAZÃO SOCIAL:14DIGITOS"
/// (Manual de Certificação Digital ICP-Brasil). Extrai a última sequência de 14
/// dígitos consecutivos encontrada no CN.
function extractCnpjFromCommonName(cn: string | null): string | null {
  if (!cn) return null;
  const match = cn.match(/(\d{14})(?!.*\d{14})/);
  return match ? match[1] : null;
}

/// Faz o parse de um certificado A1 (PKCS#12/.pfx) em memória, extraindo a
/// chave privada, o certificado X.509 e metadados de validade. Nunca persiste
/// nem loga a senha recebida (FR-007) — o chamador (UploadCertificateUseCase,
/// US3) é responsável por criptografá-la via `cert-encryption.ts` antes de
/// gravar qualquer coisa.
export function parsePkcs12(
  pfxBuffer: Buffer,
  password: string,
): ParsedCertificate {
  let p12Asn1: forge.asn1.Asn1;
  try {
    const p12Der = forge.util.createBuffer(pfxBuffer.toString('binary'));
    p12Asn1 = forge.asn1.fromDer(p12Der);
  } catch {
    throw new Pkcs12ParseError('arquivo não é um PKCS#12 (.pfx/.p12) válido');
  }

  let p12: forge.pkcs12.Pkcs12Pfx;
  try {
    p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);
  } catch {
    throw new Pkcs12ParseError(
      'senha do certificado incorreta ou arquivo corrompido',
    );
  }

  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const certBag = certBags[forge.pki.oids.certBag]?.[0];

  if (!keyBag?.key || !certBag?.cert) {
    throw new Pkcs12ParseError(
      'certificado não contém chave privada e/ou certificado X.509 válidos',
    );
  }

  const now = new Date();
  if (certBag.cert.validity.notAfter < now) {
    throw new Pkcs12ParseError(
      `certificado expirado em ${certBag.cert.validity.notAfter.toISOString()}`,
    );
  }

  const commonNameField = certBag.cert.subject.getField('CN') as
    | { value?: string }
    | undefined;
  const commonName = commonNameField?.value ?? null;

  return {
    privateKeyPem: forge.pki.privateKeyToPem(keyBag.key),
    certificatePem: forge.pki.certificateToPem(certBag.cert),
    subjectCnpj: extractCnpjFromCommonName(commonName),
    subjectCommonName: commonName,
    validFrom: certBag.cert.validity.notBefore,
    validUntil: certBag.cert.validity.notAfter,
  };
}
