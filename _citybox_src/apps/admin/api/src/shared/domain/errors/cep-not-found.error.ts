import { DomainError } from '../../core/errors/domain.error';

export class CepNotFoundError extends DomainError {
  constructor(context: string, cep: string) {
    super({
      internalMessage: `CEP "${cep}" not found`,
      externalMessage: 'CEP não encontrado. Preencha o endereço manualmente.',
      context,
    });
  }
}
