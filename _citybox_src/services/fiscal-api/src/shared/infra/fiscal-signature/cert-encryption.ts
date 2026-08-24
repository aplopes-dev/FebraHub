import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import {
  CertDecryptionError,
  CertEncryptionKeyMissingError,
} from './errors/cert-encryption.error';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12; // 96 bits — tamanho recomendado de IV para GCM
const KEY_LENGTH_BYTES = 32; // 256 bits

/// Nunca decorar com @Injectable/classe — funções puras para ficarem triviais
/// de testar isoladamente (T027) sem precisar de um contexto Nest.
function loadEncryptionKey(): Buffer {
  const base64Key = process.env.FISCAL_CERT_ENCRYPTION_KEY;
  if (!base64Key?.trim()) {
    throw new CertEncryptionKeyMissingError();
  }
  const key = Buffer.from(base64Key, 'base64');
  if (key.length !== KEY_LENGTH_BYTES) {
    throw new CertEncryptionKeyMissingError(
      `FISCAL_CERT_ENCRYPTION_KEY deve decodificar para ${KEY_LENGTH_BYTES} bytes (256 bits) em base64, recebeu ${key.length}`,
    );
  }
  return key;
}

/// Criptografa a senha do certificado digital (ou qualquer segredo curto) com
/// AES-256-GCM. Formato serializado: `base64(iv).base64(authTag).base64(ciphertext)`
/// — nunca persistir/logar o `plaintext` em nenhuma outra forma (FR-007).
export function encryptSecret(plaintext: string): string {
  const key = loadEncryptionKey();
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [iv, authTag, ciphertext]
    .map((buf) => buf.toString('base64'))
    .join('.');
}

/// Decripta um segredo serializado por `encryptSecret`. Lança
/// `CertDecryptionError` se a chave estiver errada ou os dados corrompidos
/// (a verificação de integridade do GCM falha e nunca retorna texto parcial).
export function decryptSecret(serialized: string): string {
  const key = loadEncryptionKey();
  const parts = serialized.split('.');
  if (parts.length !== 3) {
    throw new CertDecryptionError('formato de payload criptografado inválido');
  }
  const [ivB64, authTagB64, ciphertextB64] = parts;
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const ciphertext = Buffer.from(ciphertextB64, 'base64');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  try {
    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return plaintext.toString('utf8');
  } catch {
    throw new CertDecryptionError(
      'chave incorreta ou dados corrompidos (falha na verificação de integridade GCM)',
    );
  }
}

/// Variante binária de `encryptSecret`/`decryptSecret` — usada para o arquivo
/// `.pfx` bruto (não é texto), reaproveitando o mesmo AES-256-GCM via
/// codificação base64 intermediária (US3 upload, e a leitura em
/// IssueNfeUseCase para assinar).
export function encryptBinary(buffer: Buffer): string {
  return encryptSecret(buffer.toString('base64'));
}

export function decryptBinary(serialized: string): Buffer {
  return Buffer.from(decryptSecret(serialized), 'base64');
}
