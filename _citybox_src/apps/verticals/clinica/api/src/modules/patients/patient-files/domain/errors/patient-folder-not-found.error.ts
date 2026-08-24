import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class PatientFolderNotFoundError extends DomainError {
  constructor(context: string, folderId: string) {
    super({
      internalMessage: `Patient folder not found: ${folderId}`,
      externalMessage: 'Pasta não encontrada',
      context,
    });
  }
}
