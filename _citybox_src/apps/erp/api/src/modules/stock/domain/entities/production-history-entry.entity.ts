import { Entity } from '../../../../shared/core/entity';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';

export const PRODUCTION_HISTORY_KINDS = ['system', 'comment'] as const;
export type ProductionHistoryKind = (typeof PRODUCTION_HISTORY_KINDS)[number];

export type ProductionHistoryEntryProps = {
  organizationId: string;
  productionOrderId: string;
  kind: ProductionHistoryKind;
  title: string;
  description: string | null;
  userName: string;
  createdAt: Date;
};

export type CreateProductionHistoryEntryProps = {
  organizationId: string;
  productionOrderId: string;
  kind?: ProductionHistoryKind;
  title: string;
  description?: string | null;
  userName: string;
};

/**
 * Linha da timeline de uma ordem de produção — registro imutável, sem
 * update/delete (igual ao `StockMovement`).
 */
export class ProductionHistoryEntry extends Entity<ProductionHistoryEntryProps> {
  constructor(props: ProductionHistoryEntryProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    if (!PRODUCTION_HISTORY_KINDS.includes(this.props.kind)) {
      throw new ValidatorDomainError({
        internalMessage: `Invalid ProductionHistoryEntry kind ${this.props.kind}`,
        externalMessage: 'Tipo de evento do histórico inválido.',
        context: ProductionHistoryEntry.name,
      });
    }
    if (!this.props.title.trim()) {
      throw new ValidatorDomainError({
        internalMessage: 'ProductionHistoryEntry without title',
        externalMessage: 'Informe um título para o evento do histórico.',
        context: ProductionHistoryEntry.name,
      });
    }
    if (!this.props.userName.trim()) {
      throw new ValidatorDomainError({
        internalMessage: 'ProductionHistoryEntry without userName',
        externalMessage: 'Usuário do evento não identificado.',
        context: ProductionHistoryEntry.name,
      });
    }
  }

  public static create(
    props: CreateProductionHistoryEntryProps,
    id?: string,
  ): ProductionHistoryEntry {
    return new ProductionHistoryEntry(
      {
        organizationId: props.organizationId,
        productionOrderId: props.productionOrderId,
        kind: props.kind ?? 'system',
        title: props.title.trim(),
        description: props.description?.trim() || null,
        userName: props.userName,
        createdAt: new Date(),
      },
      id,
    );
  }

  public static with(
    props: ProductionHistoryEntryProps,
    id: string,
  ): ProductionHistoryEntry {
    return new ProductionHistoryEntry(props, id);
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get productionOrderId() {
    return this.props.productionOrderId;
  }
  get kind() {
    return this.props.kind;
  }
  get title() {
    return this.props.title;
  }
  get description() {
    return this.props.description;
  }
  get userName() {
    return this.props.userName;
  }
  get createdAt() {
    return this.props.createdAt;
  }
}
