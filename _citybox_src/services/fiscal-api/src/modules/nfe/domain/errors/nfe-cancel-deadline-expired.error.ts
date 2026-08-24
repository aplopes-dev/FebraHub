import { DomainError } from '../../../../shared/core/errors/domain.error';
import type { FiscalDocumentType } from '../../../fiscal-documents/domain/entities/fiscal-document.entity';

/// Como o operador chama o documento. "Documento fiscal" seria correto e
/// inútil para quem está no caixa com o cliente esperando.
const DOCUMENT_LABEL: Record<FiscalDocumentType, string> = {
  NFE: 'Nota fiscal',
  NFSE: 'Nota fiscal de serviço',
  NFCE: 'Cupom fiscal',
};

/// O que fazer agora, por tipo — a parte que evita o beco sem saída.
///
/// ⚠️ **A NFC-e não tem substituição, e a mensagem NÃO pode sugerir isso**
/// (T044). A NFS-e do Padrão Nacional tem; a NF-e tem carta de correção para
/// erro de dados e nota de devolução para desfazer a operação. Oferecer à
/// NFC-e um caminho que não existe mandaria o operador procurar um endpoint
/// que a API nunca vai ter — e ele descobriria isso no balcão.
const NEXT_STEP: Record<FiscalDocumentType, string> = {
  NFE: 'Emita uma nota de devolução para desfazer a operação, ou uma carta de correção se o erro for apenas de dados.',
  NFSE: 'Use a substituição da nota, que é o caminho previsto pelo Padrão Nacional após o prazo de cancelamento.',
  // Sem substituição, sem carta de correção: para o cupom o ajuste é
  // comercial, fora do documento fiscal.
  NFCE: 'O cupom não admite cancelamento fora do prazo nem substituição. O ajuste precisa ser tratado comercialmente, fora do documento fiscal.',
};

function formatDeadline(deadline: Date): string {
  return deadline.toLocaleString('pt-BR', { timeZone: 'America/Bahia' });
}

/// FR-004, US4 cenário 2. Nome inclui "Conflict" para casar com o mapeamento
/// de status do `AppExceptionFilter` (409).
///
/// A mensagem externa diz **o prazo em hora local e o próximo passo**. O ISO
/// cru que estava aqui antes ("expirado em 2026-08-09T12:00:00.000Z") obrigava
/// o operador a converter fuso mentalmente e não dizia o que fazer — e o prazo
/// do cupom é de 30 minutos, então essa conversa acontece com o cliente na
/// frente.
export class NfeCancelDeadlineConflictError extends DomainError {
  constructor(
    context: string,
    fiscalDocumentId: string,
    deadline: Date,
    documentType: FiscalDocumentType = 'NFE',
  ) {
    super({
      internalMessage: `${documentType} "${fiscalDocumentId}" cancel deadline expired at ${deadline.toISOString()}`,
      externalMessage:
        `${DOCUMENT_LABEL[documentType]}: prazo de cancelamento encerrado em ${formatDeadline(deadline)}. ` +
        NEXT_STEP[documentType],
      context,
    });
  }
}
