import { DomainError } from '../../../../shared/core/errors/domain.error';

export class ToothFacesNotAcceptedError extends DomainError {
  constructor(context: string, treatmentId: string) {
    super({
      internalMessage: `Treatment ${treatmentId} does not accept tooth faces`,
      externalMessage:
        'Este procedimento não aceita faces. Remova as faces do dente ou marque "Aceita faces" no plano.',
      context,
    });
  }
}
