import { DomainError } from '../../../../../shared/core/errors/domain.error';

/**
 * A soma do rateio por categoria precisa fechar com o valor total do
 * lançamento (tolerância de 1 centavo) — é esse vínculo que alimenta a DRE.
 * Sem essa checagem no servidor, um lançamento poderia registrar mais ou
 * menos dinheiro na DRE do que realmente valeu.
 */
export class AllocationMismatchError extends DomainError {
  constructor(totalCents: number, allocatedCents: number) {
    super({
      internalMessage: `Financial entry allocations sum to ${allocatedCents} cents but total is ${totalCents} cents`,
      externalMessage:
        'A soma do rateio por categoria precisa fechar com o valor total do lançamento.',
      context: AllocationMismatchError.name,
    });
  }
}
