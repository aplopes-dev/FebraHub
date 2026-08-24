import { DomainError } from '../../../../../shared/core/errors/domain.error';

/**
 * FR-001 (decisão de 2026-08-14, `research.md` D26) — importação sem conta
 * bancária informada.
 *
 * O cadastro `BankAccount` guarda só o código do banco; o arquivo OFX traz
 * agência e número de conta. Não há chave confiável entre os dois, então o
 * operador é a única fonte de verdade sobre qual conta o extrato representa —
 * o código do banco do arquivo serve apenas para pré-selecionar o campo.
 */
export class BankAccountRequiredError extends DomainError {
  constructor() {
    super({
      internalMessage:
        'Bank statement import requires an explicit bankAccountId (FR-001)',
      externalMessage: 'Selecione a conta bancária deste extrato',
      context: BankAccountRequiredError.name,
    });
  }
}
