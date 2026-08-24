import { DomainError } from '../../../../shared/core/errors/domain.error';

/**
 * Operador travado por PIN errado seguidas vezes.
 *
 * Sufixo `Locked` → **423** no `AppExceptionFilter`.
 *
 * Diferente do erro genérico de credencial, este **conta o que houve** — e é
 * deliberado. Não revelar *qual* credencial estava errada é uma coisa;
 * esconder que a conta está trancada é outra, e só produziria um operador
 * tentando o mesmo PIN correto num loop, na frente do cliente. Para chegar
 * aqui já é preciso ter uma credencial de terminal válida.
 */
export class PosOperatorLockedError extends DomainError {
  constructor(lockedUntil: Date) {
    super({
      internalMessage: `PosOperator locked until ${lockedUntil.toISOString()}`,
      externalMessage:
        'Operador bloqueado por tentativas incorretas. Peça ao gerente para redefinir o PIN.',
      context: PosOperatorLockedError.name,
    });
  }
}
