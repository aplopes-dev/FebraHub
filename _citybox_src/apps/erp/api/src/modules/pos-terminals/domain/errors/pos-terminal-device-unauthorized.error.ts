import { DomainError } from '../../../../shared/core/errors/domain.error';

/**
 * A credencial do **dispositivo** não vale mais.
 *
 * Cobre os quatro casos com uma mensagem só — token inexistente, revogado,
 * malformado e terminal desativado. O dispositivo não precisa saber qual
 * deles, e o operador vê a mesma tela de ativação em todos.
 *
 * ⚠️ **Existe para ser distinguível de `PosOperatorCredentialsUnauthorizedError`.**
 * Os dois são 401 em rotas `v1/pos/*`, e o PDV precisa reagir de formas opostas:
 * PIN errado é "tente de novo"; credencial de dispositivo inválida é "este
 * terminal foi desligado, volte para a ativação". Distinguir por texto de
 * mensagem seria frágil — o `code` do envelope de erro (que sai do `name`
 * desta classe) é o contrato.
 *
 * Sufixo `Unauthorized` → 401 pelo `AppExceptionFilter`.
 */
export class PosTerminalDeviceUnauthorizedError extends DomainError {
  constructor(reason: string) {
    super({
      internalMessage: `PosTerminal device credential rejected: ${reason}`,
      externalMessage: 'Terminal não autorizado',
      context: PosTerminalDeviceUnauthorizedError.name,
    });
  }
}
