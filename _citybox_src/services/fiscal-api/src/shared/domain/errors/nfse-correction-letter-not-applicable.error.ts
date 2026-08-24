import { DomainError } from '../../core/errors/domain.error';

/// Carta de correção é exclusiva de NF-e no desenho legal brasileiro — o
/// Padrão Nacional de NFS-e não tem esse instrumento (contracts/nfse-api.md
/// "Fora de escopo do v1": "não é uma operação do padrão NFS-e"). Todo
/// provider de NFS-e (`FiscalProvider.correctionLetter`, T063/T064) deve
/// rejeitar com este erro em vez de simular uma operação inexistente.
export class NfseCorrectionLetterNotApplicableError extends DomainError {
  constructor(context: string, fiscalDocumentId: string) {
    super({
      internalMessage: `correctionLetter is not applicable to NFS-e (fiscalDocumentId=${fiscalDocumentId}) — not part of the national standard`,
      externalMessage:
        'Carta de correção não existe para NFS-e — não é uma operação do Padrão Nacional',
      context,
    });
  }
}
