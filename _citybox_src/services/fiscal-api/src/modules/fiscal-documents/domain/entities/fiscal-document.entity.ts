import { Entity } from '../../../../shared/core/entity';
import type { FiscalDocumentItem } from './fiscal-document-item.entity';

/// ⚠️ **Espelho manual** do enum Postgres `DocumentType`. O terceiro espelho é
/// `FILE_PREFIX` em `get-auxiliary-document.use-case.ts`. Divergência entre os
/// três NÃO quebra compilação — quebra no INSERT, em runtime.
export const DOCUMENT_TYPES = ['NFE', 'NFSE', 'NFCE'] as const;
export type FiscalDocumentType = (typeof DOCUMENT_TYPES)[number];

/// ⚠️ **Segundo espelho** do enum Postgres `ProviderType` — o primeiro está em
/// `shared/domain/fiscal-provider.interface.ts` (`FISCAL_PROVIDER_TYPES`).
/// Manter os dois em sincronia é manual por decisão de projeto (o domínio não
/// depende de tipos gerados pelo Prisma). Ao alterar um, alterar o outro **e**
/// o enum no `schema.prisma` — divergência não quebra compilação, quebra no
/// INSERT em runtime.
/// ⚠️ **Segundo espelho** do enum Postgres `ProviderType` — o outro é
/// `FISCAL_PROVIDER_TYPES` em `shared/domain/fiscal-provider.interface.ts`.
/// Sincronia é manual por decisão de projeto (o domínio não depende de tipos
/// gerados pelo Prisma).
///
/// Este aqui atravessa o repositório Prisma: incluir um valor ausente do enum
/// Postgres quebra a compilação em `prisma-fiscal-document.repository.ts`.
/// `SEFIN_NACIONAL` só entrou depois da migration `nfse_padrao_nacional`.
export const PROVIDER_TYPES = ['SEFAZ_BA_NFE', 'SEFIN_NACIONAL'] as const;
export type FiscalDocumentProvider = (typeof PROVIDER_TYPES)[number];

export const DOCUMENT_ENVIRONMENTS = ['HOMOLOGATION', 'PRODUCTION'] as const;
export type FiscalDocumentEnvironment = (typeof DOCUMENT_ENVIRONMENTS)[number];

/// Status unificado — nem todo valor se aplica a todo FiscalDocumentType
/// (DENIED/CORRECTION_LETTER_AUTHORIZED/INUTILIZED são NF-e apenas). Ver
/// data-model.md "Transições de Status".
export const FISCAL_DOCUMENT_STATUSES = [
  'DRAFT',
  'VALIDATING',
  'NUMBER_RESERVED',
  'XML_GENERATED',
  'SIGNED',
  'SENT',
  'PROCESSING',
  'AUTHORIZED',
  'REJECTED',
  'DENIED',
  'CANCEL_REQUESTED',
  'CANCEL_AUTHORIZED',
  'CANCEL_REJECTED',
  'CORRECTION_LETTER_AUTHORIZED',
  'INUTILIZED',
  'ERROR',
  'SYNC_REQUIRED',
] as const;
export type FiscalDocumentStatus = (typeof FISCAL_DOCUMENT_STATUSES)[number];

export type FiscalDocumentProps = {
  companyId: string;
  customerId: string | null;
  documentType: FiscalDocumentType;
  provider: FiscalDocumentProvider;
  environment: FiscalDocumentEnvironment;
  status: FiscalDocumentStatus;
  sourceSystem: string;
  externalReference: string;
  idempotencyKey: string;
  series: string | null;
  number: string | null;
  rpsSeries: string | null;
  rpsNumber: string | null;
  accessKey: string | null;
  verificationCode: string | null;
  protocol: string | null;
  totalAmount: number;
  xmlObjectKey: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  issuedAt: Date | null;
  authorizedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/// Entidade base de NF-e/NFS-e (spec.md Key Entities). Neste Foundational só é
/// usada para leitura/consulta (FR-003); a emissão (criação) chega em US1/US2.
export class FiscalDocument extends Entity<FiscalDocumentProps> {
  private _items: FiscalDocumentItem[] = [];
  /// Join de leitura, não uma prop de domínio — mesmo padrão de `_items`
  /// (`withItems`). Nome do cliente exibido na coluna "Cliente" da tela
  /// Facilita NFE (spec `009-facilita-nfe-screen`, FR-004); nunca persistido
  /// via `save()`, só populado por quem lê (`findAll`/`findById`).
  private _customerName: string | null = null;

  constructor(props: FiscalDocumentProps, id: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    // Regras de emissão (FR-001/002/009/013) ficam nos use-cases de US1/US2 —
    // aqui a entidade só reconstrói documentos já persistidos.
  }

  public static with(props: FiscalDocumentProps, id: string): FiscalDocument {
    return new FiscalDocument(props, id);
  }

  public withItems(items: FiscalDocumentItem[]): FiscalDocument {
    this._items = items;
    return this;
  }
  public withCustomerName(name: string | null): FiscalDocument {
    this._customerName = name;
    return this;
  }

  get items() {
    return this._items;
  }
  get customerName() {
    return this._customerName;
  }
  get companyId() {
    return this.props.companyId;
  }
  get customerId() {
    return this.props.customerId;
  }
  get documentType() {
    return this.props.documentType;
  }
  get provider() {
    return this.props.provider;
  }
  get environment() {
    return this.props.environment;
  }
  get status() {
    return this.props.status;
  }
  get sourceSystem() {
    return this.props.sourceSystem;
  }
  get externalReference() {
    return this.props.externalReference;
  }
  get idempotencyKey() {
    return this.props.idempotencyKey;
  }
  get series() {
    return this.props.series;
  }
  get number() {
    return this.props.number;
  }
  get rpsSeries() {
    return this.props.rpsSeries;
  }
  get rpsNumber() {
    return this.props.rpsNumber;
  }
  get accessKey() {
    return this.props.accessKey;
  }
  get verificationCode() {
    return this.props.verificationCode;
  }
  get protocol() {
    return this.props.protocol;
  }
  get totalAmount() {
    return this.props.totalAmount;
  }
  get xmlObjectKey() {
    return this.props.xmlObjectKey;
  }
  get errorCode() {
    return this.props.errorCode;
  }
  get errorMessage() {
    return this.props.errorMessage;
  }
  get issuedAt() {
    return this.props.issuedAt;
  }
  get authorizedAt() {
    return this.props.authorizedAt;
  }
  get cancelledAt() {
    return this.props.cancelledAt;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }
}
