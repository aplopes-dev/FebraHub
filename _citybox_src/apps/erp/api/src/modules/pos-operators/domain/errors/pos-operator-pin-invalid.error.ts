import { DomainError } from '../../../../shared/core/errors/domain.error';
import { POS_OPERATOR_PIN_LENGTH } from '../validators/pos-operator-pin';

/** Sem sufixo especial → 422, como qualquer dado que não passa na validação. */
export class PosOperatorPinInvalidError extends DomainError {
  constructor() {
    super({
      internalMessage: `PIN must be exactly ${POS_OPERATOR_PIN_LENGTH} digits`,
      externalMessage: `O PIN deve ter exatamente ${POS_OPERATOR_PIN_LENGTH} dígitos`,
      context: PosOperatorPinInvalidError.name,
    });
  }
}
