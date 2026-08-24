import { Entity } from '../../../../shared/core/entity';
import type { Optional } from '../../../../shared/core/types/optional.type';
import { MovementCategoryValidatorFactory } from '../factories/movement-category-validator.factory';

export const MOVEMENT_CATEGORY_TYPES = ['entrada', 'saida'] as const;
export type MovementCategoryType = (typeof MOVEMENT_CATEGORY_TYPES)[number];

export type MovementCategoryProps = {
  organizationId: string;
  /** Rótulo exibido (ex.: CM-001). Único na empresa. */
  code: string;
  name: string;
  type: MovementCategoryType;
  /** Chave estável de sistema. Null em categorias do usuário. */
  systemKey: string | null;
  /** Seed / protegidas — não podem ser excluídas; type imutável. */
  isSystem: boolean;
  /** Unidades da organização onde a categoria aparece nos selects. */
  branchIds: string[];
  createdAt: Date;
  updatedAt: Date;
};

type CreateMovementCategoryProps = Optional<
  MovementCategoryProps,
  'isSystem' | 'systemKey' | 'createdAt' | 'updatedAt'
>;

export type UpdateMovementCategoryInput = {
  name: string;
  type: MovementCategoryType;
  branchIds: string[];
};

/** Ids repetidos viriam do formulário e explodiriam no unique do vínculo. */
function normalizeBranchIds(branchIds: readonly string[] = []): string[] {
  return [...new Set(branchIds.filter(Boolean))];
}

/**
 * Motivo classificatório de uma movimentação de estoque (entrada/saída).
 *
 * O ledger (Fase 3) referencia esta entidade; `systemKey` amarra fluxos
 * fixos (compras, transferência, etc.).
 */
export class MovementCategory extends Entity<MovementCategoryProps> {
  constructor(props: MovementCategoryProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    MovementCategoryValidatorFactory.create().validate(this);
  }

  public static create(
    props: CreateMovementCategoryProps,
    id?: string,
  ): MovementCategory {
    const now = new Date();
    return new MovementCategory(
      {
        organizationId: props.organizationId,
        code: props.code.trim().toUpperCase(),
        name: props.name.trim(),
        type: props.type,
        systemKey: props.systemKey ?? null,
        isSystem: props.isSystem ?? false,
        branchIds: normalizeBranchIds(props.branchIds),
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }

  public static with(
    props: MovementCategoryProps,
    id: string,
  ): MovementCategory {
    return new MovementCategory(props, id);
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get code() {
    return this.props.code;
  }
  get name() {
    return this.props.name;
  }
  get type() {
    return this.props.type;
  }
  get systemKey() {
    return this.props.systemKey;
  }
  get isSystem() {
    return this.props.isSystem;
  }
  get branchIds() {
    return this.props.branchIds;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  update(input: UpdateMovementCategoryInput): MovementCategory {
    return MovementCategory.with(
      {
        ...this.props,
        name: input.name.trim(),
        type: input.type,
        branchIds: normalizeBranchIds(input.branchIds),
        updatedAt: new Date(),
      },
      this.id,
    );
  }
}
