/// Tipos de provider suportados no v1 (spec.md FR-001/FR-002). Espelha o enum Prisma
/// `ProviderType`, mas como tipo de domínio independente — a camada de domínio não
/// depende de tipos gerados pelo Prisma (mesmo padrão de TAX_REGIMES em food-api).
export const FISCAL_PROVIDER_TYPES = [
  'SEFAZ_BA_NFE',
  'ILHEUS_METROPOLIS_NFSE',
  /// Sistema Nacional da NFS-e (Sefin Nacional / ADN). Substitui
  /// `ILHEUS_METROPOLIS_NFSE` — o município aderiu ao padrão nacional.
  /// ⚠️ O valor correspondente no enum Postgres `ProviderType` ainda não
  /// existe: entra na migration da spec 003, que aguarda o gate
  /// `database-reviewer`. Até lá o provider está registrado no factory mas
  /// nenhum caso de uso o seleciona — persistir um documento com este provider
  /// falharia no banco.
  'SEFIN_NACIONAL',
] as const;

export type FiscalProviderType = (typeof FISCAL_PROVIDER_TYPES)[number];

export type IssueDocumentInput = {
  fiscalDocumentId: string;
  environment: 'HOMOLOGATION' | 'PRODUCTION';
  /// XML já construído e assinado (produzido pelo toolkit de assinatura — Fase
  /// posterior, gated até T014 ser aprovado) que o provider deve transmitir.
  signedXml: Buffer;
};

export type IssueDocumentResult = {
  status: 'AUTHORIZED' | 'REJECTED' | 'SYNC_REQUIRED';
  protocol?: string;
  accessKey?: string;
  verificationCode?: string;
  authorizedXml?: Buffer;
  errorCode?: string;
  errorMessage?: string;
  /// Envelopes brutos trocados com o órgão fiscal, para a trilha de auditoria
  /// exigida por FR-011 — "o que foi enviado e o que foi recebido". O
  /// transporte já os captura; sem estes campos o provider não tinha por onde
  /// devolvê-los e a auditoria registrava só o desfecho, não a conversa.
  /// Opcionais: um provider pode não ter acesso ao envelope bruto.
  rawRequestXml?: string;
  rawResponseXml?: string;
};

export type CancelDocumentInput = {
  fiscalDocumentId: string;
  protocol: string;
  justification: string;
  /// Pedido de Registro de Evento ja montado e assinado, para providers cujo
  /// cancelamento e um EVENTO e nao uma operacao propria (Padrao Nacional da
  /// NFS-e). Montar e assinar ficam no caso de uso, como na emissao: e ele que
  /// conhece a parametrizacao municipal e decide entre cancelamento direto
  /// (`e101101`) e solicitacao de analise fiscal (`e101103`).
  ///
  /// Opcional porque a SEFAZ-BA nao usa: la o cancelamento de NF-e e montado
  /// dentro do proprio provider.
  signedEventXml?: Buffer;
};

export type CancelDocumentResult = {
  status: 'CANCEL_AUTHORIZED' | 'CANCEL_REJECTED';
  protocol?: string;
  responseXml?: Buffer;
  errorMessage?: string;
  /// Envelopes brutos trocados com o órgão fiscal (FR-011) — ver
  /// `IssueDocumentResult`. Opcionais: nem todo provider expõe o envelope.
  rawRequestXml?: string;
  rawResponseXml?: string;
};

export type ConsultDocumentInput = {
  fiscalDocumentId: string;
  protocol?: string;
  accessKey?: string;
};

export type ConsultDocumentResult = {
  status: string;
  protocol?: string;
  authorizedXml?: Buffer;
  errorMessage?: string;
};

export type CorrectionLetterInput = {
  fiscalDocumentId: string;
  /// Próximo número de sequência da carta de correção para este documento
  /// (1, 2, 3...) — um documento pode ter mais de uma CC-e ao longo do tempo.
  sequence: number;
  correctionText: string;
};

export type CorrectionLetterResult = {
  status: 'CORRECTION_LETTER_AUTHORIZED' | 'REJECTED';
  protocol?: string;
  responseXml?: Buffer;
  errorMessage?: string;
  /// Envelopes brutos trocados com o órgão fiscal (FR-011) — ver
  /// `IssueDocumentResult`. Opcionais: nem todo provider expõe o envelope.
  rawRequestXml?: string;
  rawResponseXml?: string;
};

/// Inutilização (T065, FR-006) — sem `fiscalDocumentId`: a faixa nunca teve
/// um `FiscalDocument` emitido (número nunca usado), por isso o input carrega
/// `companyId`/`series`/faixa diretamente em vez de um id de documento.
/// Sondagem de disponibilidade do órgão fiscal.
///
/// **Opcional** no contrato: nem todo provider tem um serviço de status, e
/// exigi-lo obrigaria implementações a inventar uma sondagem — tipicamente uma
/// emissão de teste, que queima numeração.
///
/// `true` = o órgão respondeu (mesmo que dizendo estar em manutenção);
/// `false` ou exceção = inalcançável. A distinção importa: quem consome usa
/// isto para decidir contingência, e "respondeu negativamente" não é o mesmo
/// que "não respondeu".
export type CheckServiceStatus = (
  environment: 'HOMOLOGATION' | 'PRODUCTION',
) => Promise<boolean>;

export type InutilizeDocumentInput = {
  companyId: string;
  environment: 'HOMOLOGATION' | 'PRODUCTION';
  series: string;
  numberStart: string;
  numberEnd: string;
  justification: string;
  /// ⚠️ Modelo da numeração: `55` (NF-e) ou `65` (NFC-e). **Obrigatório, sem
  /// padrão** — as duas numerações são separadas, e inutilizar a faixa do
  /// modelo errado queima uma faixa boa junto ao fisco e deixa a lacuna real
  /// em aberto. Nenhum dos dois é reversível por código.
  model: '55' | '65';
};

export type InutilizeDocumentResult = {
  status: 'INUTILIZED' | 'REJECTED';
  protocol?: string;
  responseXml?: Buffer;
  errorMessage?: string;
  /// Envelopes brutos trocados com o órgão fiscal (FR-011) — ver
  /// `IssueDocumentResult`. Opcionais: nem todo provider expõe o envelope.
  rawRequestXml?: string;
  rawResponseXml?: string;
};

/// Contrato Strategy (Provider Pattern pedido no briefing original) — cada órgão
/// fiscal (SEFAZ-BA, MetropolisWeb Ilhéus, futuramente outros municípios/NFS-e
/// Nacional) implementa esta interface isoladamente em `modules/providers/<nome>/`.
export abstract class FiscalProvider {
  abstract issue(input: IssueDocumentInput): Promise<IssueDocumentResult>;
  /// Falha CEDO se o ambiente pedido nao estiver configurado.
  ///
  /// Existe para ser chamado ANTES da reserva do numero fiscal. A recusa de
  /// PRODUCTION acontecia so na transmissao, entao cada tentativa mal
  /// configurada queimava um numero e deixava um documento `SIGNED` orfao —
  /// numeracao fiscal e sequencial, e salto o fisco cobra explicacao.
  ///
  /// No-op por padrao: provider que nao distingue ambientes nao precisa fazer
  /// nada, e forcar implementacao vazia em todos so adicionaria ruido.
  assertEnvironmentAvailable(environment: 'HOMOLOGATION' | 'PRODUCTION'): void {
    void environment;
  }

  /// Sondagem de disponibilidade — ver `CheckServiceStatus`.
  ///
  /// Opcional: providers que não expõem serviço de status simplesmente não
  /// implementam, e quem consome trata a ausência como "não sei, siga o
  /// caminho normal". Melhor que uma implementação padrão que devolvesse
  /// `true` — essa afirmaria disponibilidade sem ter verificado.
  checkServiceStatus?: CheckServiceStatus;

  abstract cancel(input: CancelDocumentInput): Promise<CancelDocumentResult>;
  abstract consult(input: ConsultDocumentInput): Promise<ConsultDocumentResult>;
  /// Carta de correção — exclusiva de NF-e no desenho legal (FR-005,
  /// contracts/nfse-api.md "Fora de escopo do v1"); providers de NFS-e devem
  /// rejeitar com um erro claro em vez de implementar algo sem sentido.
  abstract correctionLetter(
    input: CorrectionLetterInput,
  ): Promise<CorrectionLetterResult>;
  /// Inutilização — exclusiva de NF-e (FR-006: "faixas de numeração de
  /// NF-e"; NFS-e/DPS não tem esse conceito de numeração pré-reservada).
  /// Providers de NFS-e devem rejeitar com um erro claro, mesmo padrão de
  /// `correctionLetter`.
  abstract inutilize(
    input: InutilizeDocumentInput,
  ): Promise<InutilizeDocumentResult>;
}
