import { DomainError } from '../../../../shared/core/errors/domain.error';

/// Emissão em série **desativada** (→ 422). O campo `active` deixou de ser
/// decorativo (spec erp/011): existe uma série inativa para a chave e a emissão
/// a recusa com erro específico, em vez de seguir e numerar.
export class SeriesInactiveError extends DomainError {
  constructor(context: string, series: string) {
    super({
      internalMessage: `Fiscal sequence for series "${series}" is inactive`,
      externalMessage: `A série "${series}" está desativada e não pode emitir notas. Reative a série em Configurações › Fiscal › Séries para voltar a emitir.`,
      context,
    });
  }
}
