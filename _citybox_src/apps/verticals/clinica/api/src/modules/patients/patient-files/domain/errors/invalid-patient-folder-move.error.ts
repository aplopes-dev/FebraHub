import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class InvalidPatientFolderMoveError extends DomainError {
  constructor(context: string, folderId: string) {
    super({
      internalMessage: `Invalid folder move for folder: ${folderId}`,
      externalMessage: 'Não é possível mover a pasta para este destino',
      context,
    });
  }
}
