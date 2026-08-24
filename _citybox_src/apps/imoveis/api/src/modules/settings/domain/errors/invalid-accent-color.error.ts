import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';

export class InvalidAccentColorError extends ValidatorDomainError {
  constructor(context: string, value: string) {
    super({
      internalMessage: `Invalid accent color id: ${value}`,
      externalMessage: 'Cor de destaque inválida',
      context,
    });
  }
}
