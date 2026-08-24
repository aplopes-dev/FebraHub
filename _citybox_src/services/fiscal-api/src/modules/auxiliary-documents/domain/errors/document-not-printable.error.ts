import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import type { FiscalDocumentStatus } from '../../../fiscal-documents/domain/entities/fiscal-document.entity';

/// Mensagem por estado. Cada uma diz **o próximo passo**, não só o que houve —
/// "não autorizada" sozinha deixa o operador sem saber se espera, consulta ou
/// reemite.
const MESSAGE: Partial<Record<FiscalDocumentStatus, string>> = {
  DRAFT:
    'A nota ainda não foi transmitida ao órgão fiscal. Emita a nota antes de imprimir.',
  VALIDATING:
    'A nota ainda está em validação e não foi transmitida. Aguarde a conclusão.',
  NUMBER_RESERVED:
    'A nota teve numeração reservada, mas ainda não foi transmitida. Aguarde a conclusão.',
  XML_GENERATED:
    'A nota ainda não foi transmitida ao órgão fiscal. Aguarde a conclusão.',
  SIGNED: 'A nota foi assinada mas ainda não transmitida. Aguarde a conclusão.',
  SENT: 'A nota foi transmitida e aguarda resposta do órgão fiscal. Consulte a nota em instantes.',
  PROCESSING:
    'A nota está em processamento no órgão fiscal. Consulte a nota em instantes.',
  REJECTED:
    'A nota foi rejeitada pelo órgão fiscal e não possui documento auxiliar. Corrija os dados e emita novamente.',
  DENIED:
    'A nota foi denegada pelo órgão fiscal e não possui documento auxiliar.',
  INUTILIZED:
    'A numeração foi inutilizada — não existe nota, nem documento auxiliar.',
  ERROR:
    'A emissão falhou e a nota não foi autorizada. Consulte o histórico de eventos da nota.',
  /// Não sabemos a situação da nota junto ao órgão. Entregar papel aqui seria
  /// pior que recusar: poderia circular mercadoria com documento de uma nota
  /// que o fisco não reconhece.
  SYNC_REQUIRED:
    'A situação desta nota junto ao órgão fiscal é desconhecida. Consulte a nota antes de imprimir.',
};

/// FR-003 — recusa a geração para nota que não está autorizada, informando o
/// **estado atual**.
///
/// Mapeia para 422 por herdar `ValidatorDomainError` (ver
/// `app-exception.filter.ts`). O estado atual vai no texto porque o envelope de
/// erro deste serviço é `{ error: { code, message } }` — não há campo de
/// detalhe estruturado. `currentStatus` fica exposto como propriedade para
/// quem trata o erro em processo.
export class DocumentNotPrintableError extends ValidatorDomainError {
  constructor(
    context: string,
    fiscalDocumentId: string,
    public readonly currentStatus: FiscalDocumentStatus,
  ) {
    super({
      internalMessage: `FiscalDocument "${fiscalDocumentId}" is not printable in status ${currentStatus}`,
      externalMessage:
        MESSAGE[currentStatus] ??
        `A nota não está em situação que permita imprimir o documento auxiliar (situação atual: ${currentStatus}).`,
      externalCode: 'DOCUMENT_NOT_PRINTABLE',
      context,
    });
  }
}
