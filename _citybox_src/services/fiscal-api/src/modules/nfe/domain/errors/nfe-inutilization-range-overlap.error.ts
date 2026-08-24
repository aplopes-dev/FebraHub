import { DomainError } from '../../../../shared/core/errors/domain.error';

/// FR-006, spec.md edge case ("inutilização solicitada para uma faixa que já
/// contém documentos autorizados"). contracts/nfe-api.md `POST /nfe/inutilize`
/// → `409 Conflict`. Nome inclui "Overlap" para casar com o mapeamento de
/// status do `AppExceptionFilter` (mesmo padrão de `NfeCancelDeadlineConflictError`).
export class NfeInutilizationRangeOverlapError extends DomainError {
  constructor(context: string, overlappingNumbers: string[]) {
    super({
      internalMessage: `Inutilization range overlaps already-issued numbers: ${overlappingNumbers.join(', ')}`,
      externalMessage: `Faixa contém número(s) já emitido(s): [${overlappingNumbers.join(', ')}]`,
      context,
    });
  }
}
