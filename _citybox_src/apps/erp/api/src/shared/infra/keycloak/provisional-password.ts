import { randomInt } from 'node:crypto';

/**
 * Alfabeto sem caracteres ambíguos (`I`, `O`, `l`, `o`, `0`, `1`): a senha
 * provisória costuma ser ditada por telefone ou copiada à mão.
 */
const PASSWORD_CHARS =
  'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

const DEFAULT_LENGTH = 12;

/**
 * Senha de primeiro acesso. O Keycloak a marca como temporária e força
 * `UPDATE_PASSWORD` no login — ela nunca vira credencial definitiva.
 *
 * Usa `randomInt` (CSPRNG) e não `Math.random`: é material de credencial, ainda
 * que de vida curta.
 */
export function generateProvisionalPassword(length = DEFAULT_LENGTH): string {
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += PASSWORD_CHARS[randomInt(PASSWORD_CHARS.length)];
  }
  return result;
}
