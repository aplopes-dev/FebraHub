import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class PatientFileNotFoundError extends DomainError {
  constructor(context: string, fileId: string) {
    super({
      internalMessage: `Patient file not found: ${fileId}`,
      externalMessage: 'Arquivo não encontrado',
      context,
    });
  }
}
