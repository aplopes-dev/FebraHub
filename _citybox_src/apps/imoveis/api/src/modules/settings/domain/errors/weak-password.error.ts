import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';

export class WeakPasswordError extends ValidatorDomainError {
  constructor(context: string, minLength: number) {
    super({
      internalMessage: `Password shorter than ${minLength} characters`,
      externalMessage: `A nova senha precisa ter ao menos ${minLength} caracteres`,
      context,
    });
  }
}
