import type { ObjectStorage } from '../../../shared/domain/storage/object-storage.interface';
import type { FiscalDocumentType } from '../domain/entities/fiscal-document.entity';

export type ProviderExchange = {
  rawRequestXml?: string;
  rawResponseXml?: string;
};

export type ArchivedExchangeKeys = {
  requestXmlObjectKey: string | null;
  responseXmlObjectKey: string | null;
};

/// Arquiva os envelopes brutos trocados com o órgão fiscal e devolve as chaves
/// para gravar em `ProviderRequest` — FR-011 exige registrar "o que foi
/// enviado e o que foi recebido", não apenas o desfecho.
///
/// Vive fora dos casos de uso porque NF-e e NFS-e precisam exatamente do mesmo
/// arquivamento; duplicá-lo garantiria que as trilhas divergissem.
///
/// Falha de arquivamento **não** derruba a emissão: a nota pode já estar
/// autorizada junto ao órgão fiscal, e perder a cópia de auditoria é um
/// problema menor do que devolver erro para uma emissão que deu certo. O
/// chamador recebe `null` nas chaves e o registro fica sem anexo, o que é
/// visível na própria trilha.
export async function archiveProviderExchange(
  storage: ObjectStorage,
  input: {
    companyId: string;
    documentId: string;
    /// Derivado de `FiscalDocumentType` em vez de escrito a mão: acrescentar
    /// um tipo novo passa a ser erro de compilação aqui, e não um caminho de
    /// storage silenciosamente errado.
    documentKind: Lowercase<FiscalDocumentType>;
    operation: string;
    exchange: ProviderExchange;
  },
): Promise<ArchivedExchangeKeys> {
  const prefix = `${input.companyId}/${input.documentKind}/exchange/${input.documentId}/${input.operation.toLowerCase()}`;

  const put = async (
    suffix: 'request' | 'response',
    xml: string | undefined,
  ): Promise<string | null> => {
    if (!xml) return null;
    const key = `${prefix}-${suffix}.xml`;
    try {
      await storage.put({
        key,
        buffer: Buffer.from(xml, 'utf-8'),
        mimeType: 'application/xml',
      });
      return key;
    } catch {
      return null;
    }
  };

  const [requestXmlObjectKey, responseXmlObjectKey] = await Promise.all([
    put('request', input.exchange.rawRequestXml),
    put('response', input.exchange.rawResponseXml),
  ]);

  return { requestXmlObjectKey, responseXmlObjectKey };
}
