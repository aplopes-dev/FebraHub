import type {
  FiscalDocument,
  FiscalDocumentType,
} from '../domain/entities/fiscal-document.entity';

/// Segmento de caminho no storage, por tipo de documento.
///
/// `Record` total: acrescentar um tipo novo sem entrada aqui é erro de
/// compilação, e não um caminho de arquivo silenciosamente errado. O tipo é
/// `Lowercase<FiscalDocumentType>` para que `archiveProviderExchange` continue
/// aceitando só valores que existem.
export const DOCUMENT_KIND_BY_TYPE: Record<
  FiscalDocumentType,
  Lowercase<FiscalDocumentType>
> = {
  NFE: 'nfe',
  NFSE: 'nfse',
  NFCE: 'nfce',
};

/// Onde arquivar as trocas com o órgão fiscal deste documento.
///
/// Existe porque os casos de uso de cancelamento e inutilização são
/// **genéricos** — servem NF-e e NFC-e —, e um `'nfe'` fixo arquivaria o XML de
/// cancelamento de um cupom sob o caminho da nota. Rastro no lugar errado é o
/// tipo de defeito que só aparece numa auditoria, quando já não dá para
/// reconstituir.
export function documentKindOf(
  document: FiscalDocument,
): Lowercase<FiscalDocumentType> {
  return DOCUMENT_KIND_BY_TYPE[document.documentType];
}
