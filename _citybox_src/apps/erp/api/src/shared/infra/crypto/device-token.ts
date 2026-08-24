import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/** 32 bytes = 256 bits de entropia. */
const TOKEN_BYTES = 32;

/**
 * Credencial de dispositivo de um terminal de PDV.
 *
 * **Por que SHA-256 aqui e scrypt no PIN?** Não é descuido: os dois protegem
 * coisas de entropia oposta. Um PIN tem 10 mil combinações e precisa de hash
 * lento para encarecer a força bruta. Um device token tem 256 bits aleatórios —
 * não existe força bruta viável, e o hash lento só traria custo por
 * requisição. É o mesmo tratamento que se dá a chave de API.
 *
 * E há uma razão prática: o `DeviceAuthGuard` precisa **encontrar** o terminal
 * a partir do token. Com hash salgado (scrypt/Argon2) isso exigiria varrer
 * todos os terminais a cada requisição; determinístico, é um índice.
 */
export class DeviceToken {
  /** Token em claro. Só existe uma vez, na resposta do `redeem`. */
  static generate(): string {
    return randomBytes(TOKEN_BYTES).toString('base64url');
  }

  static hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Compara dois hashes em tempo constante.
   *
   * O guard busca por índice (o que já revela por tempo se existe ou não),
   * mas a confirmação final passa por aqui — comparar segredo com `===` é o
   * tipo de detalhe que ninguém revisa depois de escrito.
   */
  static matches(token: string, storedHash: string): boolean {
    const candidate = Buffer.from(DeviceToken.hash(token), 'hex');
    let stored: Buffer;
    try {
      stored = Buffer.from(storedHash, 'hex');
    } catch {
      return false;
    }
    if (candidate.length !== stored.length) return false;
    return timingSafeEqual(candidate, stored);
  }
}
