import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';

export type CostCenterProps = {
  organizationId: string;
  name: string;
  systemKey: string | null;
  isSystem: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type CreateCostCenterProps = Optional<
  CostCenterProps,
  'systemKey' | 'isSystem' | 'deletedAt' | 'createdAt' | 'updatedAt'
>;

/**
 * Centro de custo: a que área da empresa um lançamento financeiro pertence.
 *
 * O nome é único por organização — duas empresas podem ter "Administrativo"
 * sem saber uma da outra.
 */
export class CostCenter extends Entity<CostCenterProps> {
  constructor(props: CostCenterProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    // Validação de formato no DTO HTTP; domínio guarda só invariantes simples.
  }

  public static create(props: CreateCostCenterProps, id?: string): CostCenter {
    const now = new Date();
    return new CostCenter(
      {
        organizationId: props.organizationId,
        name: props.name.trim(),
        systemKey: props.systemKey ?? null,
        isSystem: props.isSystem ?? false,
        deletedAt: props.deletedAt ?? null,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }

  public static with(props: CostCenterProps, id: string): CostCenter {
    return new CostCenter(props, id);
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get name() {
    return this.props.name;
  }
  get systemKey() {
    return this.props.systemKey;
  }
  get isSystem() {
    return this.props.isSystem;
  }
  get deletedAt() {
    return this.props.deletedAt;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  update(input: { name: string }): CostCenter {
    return CostCenter.with(
      {
        ...this.props,
        name: input.name.trim(),
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  /**
   * Desativa o centro de custo sem apagá-lo: lançamentos já registrados
   * apontam para ele, e o histórico precisa continuar resolvendo.
   */
  softDelete(): CostCenter {
    const now = new Date();
    return CostCenter.with(
      { ...this.props, deletedAt: now, updatedAt: now },
      this.id,
    );
  }

  restore(): CostCenter {
    return CostCenter.with(
      { ...this.props, deletedAt: null, updatedAt: new Date() },
      this.id,
    );
  }
}
