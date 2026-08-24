import { Entity } from '../../../../../shared/core/entity';

export type FinancialEntryAttachmentProps = {
  organizationId: string;
  financialEntryId: string;
  fileName: string;
  /** Chave no MinIO — nunca exposta ao cliente. */
  objectKey: string;
  contentType: string;
  sizeBytes: number;
  createdAt: Date;
};

type CreateFinancialEntryAttachmentProps = Omit<
  FinancialEntryAttachmentProps,
  'createdAt'
> & { createdAt?: Date };

/**
 * Um comprovante anexado a um lançamento. Diferente de `payments`/
 * `allocations`, tem CRUD HTTP próprio (upload/download/remoção assíncronos,
 * fora do payload principal do lançamento) e identidade estável entre
 * requisições — por isso é uma `Entity` de verdade, não um value object
 * embutido. Imutável: só cria e apaga, nunca atualiza.
 */
export class FinancialEntryAttachment extends Entity<FinancialEntryAttachmentProps> {
  constructor(props: FinancialEntryAttachmentProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    // Validação de tipo/tamanho fica no AttachmentFileValidator, sobre o
    // buffer bruto, antes de a entidade existir.
  }

  public static create(
    props: CreateFinancialEntryAttachmentProps,
    id?: string,
  ): FinancialEntryAttachment {
    return new FinancialEntryAttachment(
      { ...props, createdAt: props.createdAt ?? new Date() },
      id,
    );
  }

  public static with(
    props: FinancialEntryAttachmentProps,
    id: string,
  ): FinancialEntryAttachment {
    return new FinancialEntryAttachment(props, id);
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get financialEntryId() {
    return this.props.financialEntryId;
  }
  get fileName() {
    return this.props.fileName;
  }
  get objectKey() {
    return this.props.objectKey;
  }
  get contentType() {
    return this.props.contentType;
  }
  get sizeBytes() {
    return this.props.sizeBytes;
  }
  get createdAt() {
    return this.props.createdAt;
  }
}
