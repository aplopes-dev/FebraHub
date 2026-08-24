import { DomainError } from '../../../../shared/core/errors/domain.error';

/**
 * Código ou PIN errado — **um erro só para os dois**.
 *
 * Sufixo `Unauthorized` → 401. Mensagens distintas para "esse código não
 * existe" e "o PIN está errado" entregariam a lista de operadores da unidade a
 * quem estivesse tentando adivinhar.
 */
export class PosOperatorCredentialsUnauthorizedError extends DomainError {
  constructor() {
    super({
      internalMessage: 'PosOperator code or PIN did not match',
      externalMessage: 'Código ou PIN incorreto',
      context: PosOperatorCredentialsUnauthorizedError.name,
    });
  }
}
