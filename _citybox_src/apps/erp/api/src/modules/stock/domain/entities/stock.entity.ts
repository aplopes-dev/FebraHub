import { Entity } from '../../../../shared/core/entity';
import type { Optional } from '../../../../shared/core/types/optional.type';
import { StockValidatorFactory } from '../factories/stock-validator.factory';

export const STOCK_LOCATIONS = ['proprio', 'externo', 'deposito'] as const;
export type StockLocation = (typeof STOCK_LOCATIONS)[number];

export const STOCK_PROPERTIES = ['proprio', 'terceiro'] as const;
export type StockProperty = (typeof STOCK_PROPERTIES)[number];

export type StockProps = {
  organizationId: string;
  name: string;
  location: StockLocation;
  property: StockProperty;
  /** Unidades da organização com acesso a este depósito. */
  branchIds: string[];
  /** Estoque padrão da operação — não pode ser excluído. */
  isDefault: boolean;
  systemKey: string | null;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type CreateStockProps = Optional<
  StockProps,
  | 'isDefault'
  | 'systemKey'
  | 'isSystem'
  | 'createdAt'
  | 'updatedAt'
  | 'branchIds'
>;

export type UpdateStockInput = {
  name: string;
  location: StockLocation;
  property: StockProperty;
  branchIds: string[];
};

/** Ids repetidos viriam do formulário e explodiriam no unique do vínculo. */
function normalizeBranchIds(branchIds: readonly string[] = []): string[] {
  return [...new Set(branchIds.filter(Boolean))];
}

/**
 * Depósito / espaço de armazenagem da organização.
 *
 * Não confundir com saldo: o `Stock` é o cadastro do local; quantidade vive
 * em `StockBalance` (fase posterior).
 */
export class Stock extends Entity<StockProps> {
  constructor(props: StockProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    StockValidatorFactory.create().validate(this);
  }

  public static create(props: CreateStockProps, id?: string): Stock {
    const now = new Date();
    return new Stock(
      {
        organizationId: props.organizationId,
        name: props.name.trim(),
        location: props.location,
        property: props.property,
        branchIds: normalizeBranchIds(props.branchIds),
        isDefault: props.isDefault ?? false,
        systemKey: props.systemKey ?? null,
        isSystem: props.isSystem ?? false,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }

  public static with(props: StockProps, id: string): Stock {
    return new Stock(props, id);
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get name() {
    return this.props.name;
  }
  get location() {
    return this.props.location;
  }
  get property() {
    return this.props.property;
  }
  get branchIds() {
    return this.props.branchIds;
  }
  get isDefault() {
    return this.props.isDefault;
  }
  get systemKey() {
    return this.props.systemKey;
  }
  get isSystem() {
    return this.props.isSystem;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  update(input: UpdateStockInput): Stock {
    return Stock.with(
      {
        ...this.props,
        name: input.name.trim(),
        location: input.location,
        property: input.property,
        branchIds: normalizeBranchIds(input.branchIds),
        updatedAt: new Date(),
      },
      this.id,
    );
  }
}
