import { DomainError } from '../../core/errors/domain.error';

/// Inutilização de faixa de numeração é exclusiva de NF-e (FR-006: "faixas
/// de numeração de NF-e") — o Padrão Nacional de NFS-e (DPS) não reserva
/// numeração sequencial pré-impressa da mesma forma, então o conceito não se
/// aplica. Todo provider de NFS-e (`FiscalProvider.inutilize`) deve
/// rejeitar com este erro em vez de simular uma operação inexistente —
/// mesmo padrão de `NfseCorrectionLetterNotApplicableError`.
export class NfseInutilizationNotApplicableError extends DomainError {
  constructor(context: string, companyId: string) {
    super({
      internalMessage: `inutilize is not applicable to NFS-e (companyId=${companyId}) — not part of the national standard`,
      externalMessage:
        'Inutilização de faixa não existe para NFS-e — não é uma operação do Padrão Nacional',
      context,
    });
  }
}
