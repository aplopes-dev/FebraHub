import { DomainError } from '../../../../shared/core/errors/domain.error';

/// D3 — a retomada de uma transmissão interrompida relê o XML assinado gravado
/// antes da tentativa anterior. Sem esse XML não há retomada segura: re-assinar
/// geraria uma chave de acesso diferente para um número de nota que a SEFAZ
/// pode já ter recebido. Acontece com documentos numerados antes de a gravação
/// pré-transmissão existir; a saída é consultar a situação da nota na SEFAZ
/// (`POST /nfe/{id}/consult`) em vez de reemitir.
export class SignedXmlNotFoundError extends DomainError {
  constructor(context: string, fiscalDocumentId: string) {
    super({
      internalMessage: `FiscalDocument "${fiscalDocumentId}" has no stored signed XML — cannot resume transmission`,
      externalMessage:
        'Documento já numerado não possui XML assinado armazenado para retomar a transmissão. Consulte a situação da nota junto ao órgão fiscal antes de reemitir.',
      context,
    });
  }
}
