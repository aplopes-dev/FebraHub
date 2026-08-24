import {
  randomBytes,
  scrypt,
  timingSafeEqual,
  type ScryptOptions,
} from 'node:crypto';

// `promisify(scrypt)` perde a sobrecarga com `options` e o TypeScript passa a
// aceitar só 3 argumentos — daí o wrapper explícito.
function scryptAsync(
  password: string,
  salt: Buffer,
  keyLength: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

/**
 * Parâmetros do scrypt. `N` é o custo de memória: 2^16 × 128 × r ≈ 67 MB e
 * ~100 ms por verificação — caro o bastante para um PIN de 4 dígitos (10 mil
 * combinações levariam ~17 min de força bruta offline), barato o bastante para
 * um login de caixa que acontece algumas vezes por dia.
 */
const SCRYPT_N = 65536;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
/** Node recusa alocar acima do `maxmem` padrão (32 MB) com este `N`. */
const MAX_MEM = 96 * 1024 * 1024;

const ALGORITHM = 'scrypt';

/**
 * Hash de PIN de operador de PDV.
 *
 * **Isolado num serviço só** por dois motivos. O primeiro é que o M4 do plano
 * de autenticação vai sincronizar estes hashes para o dispositivo, para
 * validação offline — e aí o formato tem que ser reproduzível do outro lado.
 * O segundo é que o algoritmo precisa poder mudar num lugar só: o valor
 * gravado carrega o próprio algoritmo e parâmetros no prefixo
 * (`scrypt$N$r$p$salt$hash`), então migrar para Argon2id depois é re-hashear na
 * próxima verificação bem-sucedida, sem migration de dados.
 *
 * O PIN **nunca** é comparado fora daqui, e a comparação é em tempo constante:
 * `===` sobre hash vaza informação por tempo de resposta.
 *
 * > Desvio registrado: o PRD e o plano diziam Argon2id. Ficou scrypt porque
 * > vem no Node (`node:crypto`) e evita dependência nativa com node-gyp na
 * > imagem da API. Ambos são recomendados pela OWASP para senha; o que protege
 * > um PIN de 4 dígitos de verdade é o bloqueio por tentativas, não o hash.
 */
export class PinHasher {
  static async hash(pin: string): Promise<string> {
    const salt = randomBytes(SALT_LENGTH);
    const derived = await PinHasher.derive(pin, salt);
    return [
      ALGORITHM,
      SCRYPT_N,
      SCRYPT_R,
      SCRYPT_P,
      salt.toString('base64'),
      derived.toString('base64'),
    ].join('$');
  }

  /**
   * `false` — nunca uma exceção — para valor gravado corrompido ou em formato
   * desconhecido: um hash ilegível é um PIN que não confere, não um erro 500
   * na tela de login do caixa.
   */
  static async verify(pin: string, stored: string): Promise<boolean> {
    const parts = stored.split('$');
    if (parts.length !== 6 || parts[0] !== ALGORITHM) return false;

    const n = Number(parts[1]);
    const r = Number(parts[2]);
    const p = Number(parts[3]);
    if (
      !Number.isSafeInteger(n) ||
      !Number.isSafeInteger(r) ||
      !Number.isSafeInteger(p)
    ) {
      return false;
    }

    let salt: Buffer;
    let expected: Buffer;
    try {
      salt = Buffer.from(parts[4], 'base64');
      expected = Buffer.from(parts[5], 'base64');
    } catch {
      return false;
    }
    if (salt.length === 0 || expected.length === 0) return false;

    const derived = await PinHasher.derive(pin, salt, {
      N: n,
      r,
      p,
      keyLength: expected.length,
    });
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  }

  private static derive(
    pin: string,
    salt: Buffer,
    options: { N?: number; r?: number; p?: number; keyLength?: number } = {},
  ): Promise<Buffer> {
    const keyLength = options.keyLength ?? KEY_LENGTH;
    return scryptAsync(pin, salt, keyLength, {
      N: options.N ?? SCRYPT_N,
      r: options.r ?? SCRYPT_R,
      p: options.p ?? SCRYPT_P,
      maxmem: MAX_MEM,
    });
  }
}
