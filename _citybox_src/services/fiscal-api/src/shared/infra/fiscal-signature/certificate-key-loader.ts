import { ObjectStorage } from '../../domain/storage/object-storage.interface';
import { decryptBinary, decryptSecret } from './cert-encryption';
import { parsePkcs12 } from './pkcs12-parser';

export type CertificateKeyMaterial = {
  privateKeyPem: string;
  certificatePem: string;
};

/// Tipo estrutural (não importa a entidade `Certificate` de `modules/certificates`
/// — `shared/infra` não deve depender de `modules/*`) com só os dois campos
/// necessários para decifrar o `.pfx`.
export type CertificateKeyMaterialSource = {
  encryptedPfxObjectKey: string;
  encryptedPassword: string;
};

/// Carrega e decifra o material de chave/certificado (PEM) de um Certificate
/// já persistido — usado tanto para assinar XML (XMLDSig, `xml-signer.ts`)
/// quanto para TLS mútuo com os webservices da SEFAZ (`fiscal-soap`), já que
/// é o mesmo certificado A1 para os dois usos. Extraído de
/// `IssueNfeUseCase` (T035) para reaproveitamento em `SefazBaNfeProvider`
/// (T038) sem duplicar a lógica de decifragem (DRY).
export async function loadCertificateKeyMaterial(
  objectStorage: ObjectStorage,
  certificate: CertificateKeyMaterialSource,
): Promise<CertificateKeyMaterial> {
  const stored = await objectStorage.get(certificate.encryptedPfxObjectKey);
  const pfxBuffer = decryptBinary(stored.buffer.toString('utf-8'));
  const password = decryptSecret(certificate.encryptedPassword);
  const parsed = parsePkcs12(pfxBuffer, password);
  return {
    privateKeyPem: parsed.privateKeyPem,
    certificatePem: parsed.certificatePem,
  };
}
