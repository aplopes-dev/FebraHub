import { Entity } from '../../../../shared/core/entity';

export const FISCAL_EVENT_TYPES = [
  'ISSUE',
  'CANCEL',
  'CORRECTION_LETTER',
  'INUTILIZATION',
  'SYNC',
] as const;
export type FiscalEventType = (typeof FISCAL_EVENT_TYPES)[number];

export type FiscalEventProps = {
  /// Nullable desde T065 — eventos INUTILIZATION não têm um FiscalDocument
  /// (número nunca emitido). CANCEL/CORRECTION_LETTER sempre têm.
  fiscalDocumentId: string | null;
  eventType: FiscalEventType;
  sequence: number | null;
  status: string;
  justification: string | null;
  correctionText: string | null;
  protocol: string | null;
  requestXmlObjectKey: string | null;
  responseXmlObjectKey: string | null;
  /// Codigo oficial do evento no Padrao Nacional (`e101101` cancelamento,
  /// `e101103` analise fiscal, ...). String, nao enum interno: o codigo e do
  /// orgao fiscal e precisa sobreviver a evolucao do nosso vocabulario.
  nationalEventCode: string | null;
  /// `ambGer`: 1 = sistema proprio do municipio, 2 = Sefin Nacional, 3 = ADN.
  /// Distingue evento que NOS geramos de evento que apenas lemos — sem isso a
  /// trilha nao diz quem agiu.
  generatorEnvironment: number | null;
  /// Substituicao (`e105102`): qual documento assumiu o lugar do original.
  /// Vive no evento e nao no documento porque o vinculo E o evento — a nota
  /// original pode ter outros eventos antes e depois deste.
  replacedByDocumentId: string | null;
  createdAt: Date;
  /// Só preenchidos para eventType=INUTILIZATION — a faixa de numeração
  /// inutilizada (T065, FR-006).
  companyId: string | null;
  series: string | null;
  numberRangeStart: bigint | null;
  numberRangeEnd: bigint | null;
};

/// Cancelamento, carta de correção e inutilização vivem todos em FiscalEvent
/// (discriminado por eventType) em vez de 3 entidades separadas — research.md §3.
export class FiscalEvent extends Entity<FiscalEventProps> {
  constructor(props: FiscalEventProps, id: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    // Regras de negócio (prazo legal, campo corrigível, faixa não usada) ficam
    // nos use-cases de US4 — esta entidade reconstrói eventos já persistidos.
  }

  public static with(props: FiscalEventProps, id: string): FiscalEvent {
    return new FiscalEvent(props, id);
  }

  get fiscalDocumentId() {
    return this.props.fiscalDocumentId;
  }
  get eventType() {
    return this.props.eventType;
  }
  get sequence() {
    return this.props.sequence;
  }
  get status() {
    return this.props.status;
  }
  get justification() {
    return this.props.justification;
  }
  get correctionText() {
    return this.props.correctionText;
  }
  get protocol() {
    return this.props.protocol;
  }
  /// Chaves dos envelopes brutos no object storage (FR-011). As props já as
  /// carregavam, mas sem getter não havia como a trilha de auditoria chegar no
  /// XML — o rastro existia e era inalcançável.
  get requestXmlObjectKey() {
    return this.props.requestXmlObjectKey;
  }
  get responseXmlObjectKey() {
    return this.props.responseXmlObjectKey;
  }
  get nationalEventCode() {
    return this.props.nationalEventCode;
  }
  get generatorEnvironment() {
    return this.props.generatorEnvironment;
  }
  get replacedByDocumentId() {
    return this.props.replacedByDocumentId;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get companyId() {
    return this.props.companyId;
  }
  get series() {
    return this.props.series;
  }
  get numberRangeStart() {
    return this.props.numberRangeStart;
  }
  get numberRangeEnd() {
    return this.props.numberRangeEnd;
  }
}
