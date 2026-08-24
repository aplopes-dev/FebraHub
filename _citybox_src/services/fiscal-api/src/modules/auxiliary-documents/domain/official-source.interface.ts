import type { FiscalDocument } from '../../fiscal-documents/domain/entities/fiscal-document.entity';

/// Fonte oficial do documento auxiliar — o órgão fiscal gerando o PDF em vez de
/// nós (FR-002a).
///
/// **Por que uma porta, e não o cliente HTTP direto no use case.** Buscar o
/// documento oficial exige o certificado digital da empresa (mTLS), e o
/// certificado precisa ser localizado e descriptografado. Injetar isso no use
/// case o obrigaria a conhecer repositório de certificados e chave de
/// criptografia — responsabilidades que nada têm a ver com "entregar o
/// documento de uma nota". A porta empurra tudo isso para a infraestrutura.
///
/// ⚠️ **Nunca lança.** Devolve `null` quando o documento oficial não está
/// disponível — por qualquer motivo. A API oficial é *preferida*, não
/// *necessária*: existe caminho local completo, e a indisponibilidade do órgão
/// não pode impedir a entrega. Hoje o Sefin responde `501` em homologação, de
/// modo que `null` é a resposta esperada, não a excepcional.
export abstract class OfficialDocumentSource {
  abstract fetch(document: FiscalDocument): Promise<Buffer | null>;
}

/// Implementação nula, para quando não há fonte oficial para o tipo de
/// documento. É o caso da **NF-e**: a SEFAZ não fornece DANFE pronto — o
/// emitente é quem gera, a partir do XML autorizado. Não é lacuna a preencher
/// depois; é como o documento funciona.
export class NoOfficialSource extends OfficialDocumentSource {
  fetch(): Promise<Buffer | null> {
    return Promise.resolve(null);
  }
}
