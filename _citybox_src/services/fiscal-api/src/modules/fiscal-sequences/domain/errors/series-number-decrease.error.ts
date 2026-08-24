import { DomainError } from '../../../../shared/core/errors/domain.error';

/// Tentativa de reduzir o número atual. Bloqueado (→ 422): um número menor
/// reemite faixa já autorizada, o que a SEFAZ rejeita e não tem conserto.
/// Aumentar apenas cria salto, regularizável por inutilização.
export class SeriesNumberDecreaseError extends DomainError {
  constructor(context: string, current: bigint, requested: bigint) {
    super({
      internalMessage: `Cannot decrease sequence number from ${current} to ${requested}`,
      externalMessage: `Não é possível reduzir o número atual (${current}) para ${requested}. Reduzir reemitiria uma faixa de numeração já autorizada, o que a SEFAZ rejeita. O número só pode ser aumentado.`,
      context,
    });
  }
}
