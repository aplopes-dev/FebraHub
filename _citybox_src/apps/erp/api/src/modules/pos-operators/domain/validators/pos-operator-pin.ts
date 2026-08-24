import { PosOperatorPinInvalidError } from '../errors/pos-operator-pin-invalid.error';

/**
 * Comprimento do PIN. Quatro dígitos é o padrão de balcão — o operador digita
 * dezenas de vezes por dia, num teclado numérico, com fila esperando.
 *
 * Quatro dígitos são 10 mil combinações, o que seria fraco para uma senha
 * solta na internet. Aqui não é: o PIN só é aceito **dentro de um terminal já
 * autenticado** e com bloqueio por tentativas. Ele é segundo fator de uma
 * credencial de dispositivo, não senha isolada.
 */
export const POS_OPERATOR_PIN_LENGTH = 4;

const PIN_PATTERN = new RegExp(`^\\d{${POS_OPERATOR_PIN_LENGTH}}$`);

/**
 * Valida o PIN **em claro**, antes de virar hash.
 *
 * Mora no domínio, e não só no DTO da rota, porque a regra tem que valer para
 * qualquer caminho que crie ou troque PIN — inclusive um seed ou um comando de
 * manutenção que não passe por HTTP.
 */
export function assertValidPin(pin: string): string {
  if (!PIN_PATTERN.test(pin)) throw new PosOperatorPinInvalidError();
  return pin;
}
