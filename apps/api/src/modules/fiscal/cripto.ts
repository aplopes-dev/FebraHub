/**
 * Cifra AES-256-GCM para segredos fiscais: senha do certificado A1, token do
 * CSC e o proprio PFX (via variante binaria). Portado de
 * @citybox/fiscal-api (shared/infra/fiscal-signature/cert-encryption.ts).
 *
 * A chave vem de FISCAL_CERT_ENCRYPTION_KEY (32 bytes em base64). Sem ela, a
 * configuracao fiscal nao aceita certificado nem CSC — segredo cifrado com
 * chave vazia seria pior do que recusar. Formato serializado:
 * `base64(iv).base64(authTag).base64(ciphertext)`.
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITMO = 'aes-256-gcm';
const IV_BYTES = 12; // 96 bits, recomendado para GCM
const CHAVE_BYTES = 32; // 256 bits

export class ChaveCifraFiscalAusente extends Error {
  constructor(detalhe?: string) {
    super(
      detalhe ??
        'FISCAL_CERT_ENCRYPTION_KEY ausente ou invalida — gere com: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"',
    );
    this.name = 'ChaveCifraFiscalAusente';
  }
}

export class FalhaDecifraFiscal extends Error {
  constructor(detalhe: string) {
    super(`Falha ao decifrar segredo fiscal: ${detalhe}`);
    this.name = 'FalhaDecifraFiscal';
  }
}

function carregarChave(): Buffer {
  const base64 = process.env.FISCAL_CERT_ENCRYPTION_KEY;
  if (!base64?.trim()) throw new ChaveCifraFiscalAusente();
  const chave = Buffer.from(base64, 'base64');
  if (chave.length !== CHAVE_BYTES) {
    throw new ChaveCifraFiscalAusente(
      `FISCAL_CERT_ENCRYPTION_KEY deve decodificar para ${CHAVE_BYTES} bytes em base64, recebeu ${chave.length}`,
    );
  }
  return chave;
}

export function cifrar(texto: string): string {
  const chave = carregarChave();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITMO, chave, iv);
  const cifrado = Buffer.concat([cipher.update(texto, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, cifrado].map((b) => b.toString('base64')).join('.');
}

export function decifrar(serializado: string): string {
  const chave = carregarChave();
  const partes = serializado.split('.');
  if (partes.length !== 3) throw new FalhaDecifraFiscal('formato invalido');
  const [ivB64, tagB64, cifradoB64] = partes;
  const decipher = createDecipheriv(ALGORITMO, chave, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  try {
    const claro = Buffer.concat([
      decipher.update(Buffer.from(cifradoB64, 'base64')),
      decipher.final(),
    ]);
    return claro.toString('utf8');
  } catch {
    throw new FalhaDecifraFiscal('chave incorreta ou dados corrompidos');
  }
}

export function cifrarBinario(buf: Buffer): string {
  return cifrar(buf.toString('base64'));
}

export function decifrarBinario(serializado: string): Buffer {
  return Buffer.from(decifrar(serializado), 'base64');
}

/** Ha chave de cifra configurada? (para a UI avisar antes de pedir cert/CSC). */
export function temChaveCifra(): boolean {
  try {
    carregarChave();
    return true;
  } catch {
    return false;
  }
}
