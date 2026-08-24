import { DomainError } from '../../../../../shared/core/errors/domain.error';

/** FR-002 — arquivo que não é um OFX válido/legível. */
export class InvalidOfxFileError extends DomainError {
  constructor(reason: string) {
    super({
      internalMessage: `Invalid OFX file: ${reason}`,
      externalMessage: 'Não foi possível ler o arquivo OFX',
      context: InvalidOfxFileError.name,
    });
  }
}
