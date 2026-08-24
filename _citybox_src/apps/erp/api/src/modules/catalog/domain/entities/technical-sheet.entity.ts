import { randomUUID } from 'node:crypto';
import { Entity } from '../../../../shared/core/entity';
import type { Optional } from '../../../../shared/core/types/optional.type';

export const PRODUCTION_TYPES = ['automatic', 'productive_process'] as const;

export type ProductionType = (typeof PRODUCTION_TYPES)[number];

export type TechnicalSheetComponentLine = {
  id: string;
  componentProductId: string;
  optional: boolean;
  quantity: number;
  sortOrder: number;
};

export type TechnicalSheetOptionComponentLine = {
  id: string;
  variationOptionId: string;
  componentProductId: string;
  optional: boolean;
  quantity: number;
  sortOrder: number;
};

export type TechnicalSheetProps = {
  organizationId: string;
  productId: string;
  productionType: ProductionType;
  maxRemovableComponents: number;
  markupPercent: number;
  components: TechnicalSheetComponentLine[];
  optionComponents: TechnicalSheetOptionComponentLine[];
  createdAt: Date;
  updatedAt: Date;
};

type CreateTechnicalSheetProps = Optional<
  TechnicalSheetProps,
  'createdAt' | 'updatedAt' | 'components' | 'optionComponents'
>;

function normalizeQuantity(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return value;
}

function normalizeComponents(
  rows: TechnicalSheetComponentLine[] | undefined,
): TechnicalSheetComponentLine[] {
  const byComponent = new Map<string, TechnicalSheetComponentLine>();
  for (const row of rows ?? []) {
    if (!row.componentProductId) continue;
    byComponent.set(row.componentProductId, {
      id: row.id || randomUUID(),
      componentProductId: row.componentProductId,
      optional: Boolean(row.optional),
      quantity: normalizeQuantity(row.quantity),
      sortOrder: Number.isFinite(row.sortOrder) ? row.sortOrder : 0,
    });
  }
  return [...byComponent.values()].sort((a, b) => a.sortOrder - b.sortOrder);
}

function normalizeOptionComponents(
  rows: TechnicalSheetOptionComponentLine[] | undefined,
): TechnicalSheetOptionComponentLine[] {
  const byKey = new Map<string, TechnicalSheetOptionComponentLine>();
  for (const row of rows ?? []) {
    if (!row.variationOptionId || !row.componentProductId) continue;
    const key = `${row.variationOptionId}:${row.componentProductId}`;
    byKey.set(key, {
      id: row.id || randomUUID(),
      variationOptionId: row.variationOptionId,
      componentProductId: row.componentProductId,
      optional: Boolean(row.optional),
      quantity: normalizeQuantity(row.quantity),
      sortOrder: Number.isFinite(row.sortOrder) ? row.sortOrder : 0,
    });
  }
  return [...byKey.values()].sort((a, b) => a.sortOrder - b.sortOrder);
}

export class TechnicalSheet extends Entity<TechnicalSheetProps> {
  constructor(props: TechnicalSheetProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    // Regras de negócio (supply, opções, productionType) ficam no use case.
  }

  public static create(
    props: CreateTechnicalSheetProps,
    id?: string,
  ): TechnicalSheet {
    const maxRemovable = Number.isFinite(props.maxRemovableComponents)
      ? Math.max(0, Math.trunc(props.maxRemovableComponents))
      : 0;
    const markup = Number.isFinite(props.markupPercent)
      ? Math.max(0, props.markupPercent)
      : 0;

    return new TechnicalSheet(
      {
        organizationId: props.organizationId,
        productId: props.productId,
        productionType: props.productionType,
        maxRemovableComponents: maxRemovable,
        markupPercent: markup,
        components: normalizeComponents(props.components),
        optionComponents: normalizeOptionComponents(props.optionComponents),
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  public static with(props: TechnicalSheetProps, id: string): TechnicalSheet {
    return new TechnicalSheet(props, id);
  }

  public static hasComposition(sheet: TechnicalSheet | null): boolean {
    if (!sheet) return false;
    return sheet.components.length > 0 || sheet.optionComponents.length > 0;
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get productId() {
    return this.props.productId;
  }
  get productionType() {
    return this.props.productionType;
  }
  get maxRemovableComponents() {
    return this.props.maxRemovableComponents;
  }
  get markupPercent() {
    return this.props.markupPercent;
  }
  get components() {
    return this.props.components;
  }
  get optionComponents() {
    return this.props.optionComponents;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }
}
