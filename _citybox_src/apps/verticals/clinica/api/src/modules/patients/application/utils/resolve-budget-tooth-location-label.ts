import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import { ToothFacesNotAcceptedError } from '../../domain/errors/tooth-faces-not-accepted.error';
import {
  normalizeToothLocationLabel,
  parseToothLocationLabel,
} from '../../../../shared/core/utils/tooth-location-label';

export function resolveBudgetToothLocationLabel(input: {
  context: string;
  locationType: string;
  locationLabel: string;
  treatmentId: string;
  acceptsFaces: boolean;
}): string {
  const trimmed = input.locationLabel.trim();

  if (input.locationType !== 'tooth') {
    return trimmed;
  }

  const parsed = parseToothLocationLabel(trimmed);
  if (!parsed) {
    throw new ValidatorDomainError({
      internalMessage: `Invalid tooth locationLabel: ${trimmed}`,
      externalMessage:
        'Localização do dente inválida. Use o número do dente, opcionalmente com faces (ex.: 15 · M,O/I).',
      context: input.context,
    });
  }

  if (parsed.faces.length > 0 && !input.acceptsFaces) {
    throw new ToothFacesNotAcceptedError(input.context, input.treatmentId);
  }

  return normalizeToothLocationLabel(trimmed) ?? trimmed;
}
