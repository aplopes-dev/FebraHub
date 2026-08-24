import { DomainError } from '../../../../shared/core/errors/domain.error';

/// Guard-rail de forma antes de checar sobreposição/transmitir — faixa
/// numérica precisa ser válida (início <= fim, ambos positivos). Mapeia para
/// `422` (default do `AppExceptionFilter` para `DomainError`), distinto do
/// `409` de `NfeInutilizationRangeOverlapError`.
export class NfeInutilizationInvalidRangeError extends DomainError {
  constructor(context: string, numberStart: number, numberEnd: number) {
    super({
      internalMessage: `Invalid inutilization range: numberStart=${numberStart}, numberEnd=${numberEnd}`,
      externalMessage:
        'Faixa de numeração inválida — numberStart deve ser positivo e menor ou igual a numberEnd',
      context,
    });
  }
}
