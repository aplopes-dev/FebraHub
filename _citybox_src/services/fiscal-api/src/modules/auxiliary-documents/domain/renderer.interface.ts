/// Entrada da renderização.
///
/// ⚠️ Recebe **XML**, nunca a entidade `FiscalDocument`. Não é preferência de
/// estilo: é o que torna FR-008 verdadeiro por construção. Um renderizador que
/// não tem acesso ao repositório **não consegue** deixar uma mudança de
/// cadastro vazar para a reimpressão de uma nota antiga — a garantia é de
/// tipo, não de disciplina de quem escreve o código.
export type RenderInput = {
  /// O XML efetivamente autorizado pelo órgão fiscal (FR-001).
  authorizedXml: Buffer;
  /// FR-006 — nota cancelada é entregue **marcada**, não recusada: o histórico
  /// precisa ser reconstituível.
  isCancelled: boolean;
  /// FR-006, só NFS-e — chave de acesso da nota substituta.
  substitutedBy?: string;
};

/// Porta de renderização. Classe abstrata (e não `interface`) porque serve
/// também de token de injeção do Nest — o mesmo padrão de
/// `ObjectStorage` e `FiscalDocumentRepository` neste serviço.
///
/// Duas implementações, escolhidas por `documentType`:
/// - `DanfeRenderer`  — adapter sobre biblioteca de terceiro (research.md R2)
/// - `DanfseRenderer` — implementação própria (research.md R3)
///
/// A divergência é deliberada: para DANFE existe biblioteca MIT mantida que já
/// implementa o leiaute regulado; para DANFSE as opções são caixas-pretas sem
/// repositório público. Esta porta é o que mantém essa diferença invisível
/// para o use case.
export abstract class AuxiliaryDocumentRenderer {
  abstract render(input: RenderInput): Promise<Buffer>;
}
