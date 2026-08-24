import { DomainError } from '../../../../../shared/core/errors/domain.error';

/**
 * FR-001 (decisão de 2026-08-14, `research.md` D26) — a organização não tem
 * nenhuma conta bancária cadastrada, então não há o que informar na importação.
 *
 * Existe como erro próprio (em vez de cair no `BankAccountRequiredError`) para
 * a interface conseguir orientar o caminho certo: não adianta pedir para o
 * operador escolher uma conta numa lista vazia — ele precisa cadastrar a conta
 * primeiro.
 */
export class NoBankAccountRegisteredError extends DomainError {
  constructor() {
    super({
      internalMessage:
        'Organization has no registered bank account to import a statement into',
      externalMessage:
        'Cadastre uma conta bancária antes de importar um extrato',
      context: NoBankAccountRegisteredError.name,
    });
  }
}
