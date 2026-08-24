import { DomainError } from '../../../../shared/core/errors/domain.error';

/// Exclusão de série com numeração já usada (→ 422). Série usada é histórico de
/// controle fiscal: só pode ser desativada, nunca apagada.
export class SeriesInUseError extends DomainError {
  constructor(context: string, current: bigint) {
    super({
      internalMessage: `Cannot delete a sequence already in use (currentNumber=${current})`,
      externalMessage:
        'Esta série já emitiu notas e não pode ser excluída — o registro é histórico fiscal. Você pode desativá-la para bloquear novas emissões.',
      context,
    });
  }
}
