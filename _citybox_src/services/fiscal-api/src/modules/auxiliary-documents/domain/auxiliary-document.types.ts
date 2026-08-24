/// Origem do documento auxiliar.
///
/// Existe porque duas fontes podem produzir o documento da MESMA nota: a
/// geração local e a API oficial de DANFSE do Sefin Nacional (FR-002a). Sem
/// registrar qual delas produziu o arquivo, uma diferença visual entre duas
/// vias da mesma nota vira mistério numa fiscalização (FR-002b).
export const DOCUMENT_ORIGINS = ['LOCAL', 'OFFICIAL_API'] as const;
export type DocumentOrigin = (typeof DOCUMENT_ORIGINS)[number];

/// Resultado da geração. É valor de passagem — **nunca** é persistido.
///
/// O documento auxiliar é função pura do XML autorizado, que já está
/// armazenado e é imutável. Persistir o derivado criaria um segundo artefato a
/// invalidar, e uma cópia capaz de divergir da nota.
export type AuxiliaryDocument = {
  content: Buffer;
  mimeType: 'application/pdf';
  /// `DANFE-{chave}.pdf` / `DANFSE-{chave}.pdf`.
  fileName: string;
  origin: DocumentOrigin;
  /// `false` em homologação — é o mesmo critério que dispara a marca d'água
  /// (FR-005). Exposto no header `X-Fiscal-Validity` para que o consumidor não
  /// dependa de leitura visual do PDF para saber que o papel não vale.
  isFiscallyValid: boolean;
};
