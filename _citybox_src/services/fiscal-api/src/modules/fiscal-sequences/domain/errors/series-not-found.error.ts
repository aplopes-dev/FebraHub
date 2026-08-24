import { DomainError } from '../../../../shared/core/errors/domain.error';

/// Série inexistente (ou de outro Emitente). "NotFound" → 404 no
/// AppExceptionFilter. Cross-tenant também cai aqui (não revela existência).
export class SeriesNotFoundError extends DomainError {
  constructor(context: string, sequenceId: string) {
    super({
      internalMessage: `Fiscal sequence "${sequenceId}" not found`,
      externalMessage: 'Série de nota fiscal não encontrada.',
      context,
    });
  }
}
