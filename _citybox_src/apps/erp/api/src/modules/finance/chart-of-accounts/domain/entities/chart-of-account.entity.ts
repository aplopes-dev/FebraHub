import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';

export type ChartOfAccountProps = {
  organizationId: string;
  name: string;
  financialGroupId: string;
  /** Disponibiliza a conta no seletor de contas do PDV. */
  availableForPdv: boolean;
  systemKey: string | null;
  isSystem: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type CreateChartOfAccountProps = Optional<
  ChartOfAccountProps,
  | 'availableForPdv'
  | 'systemKey'
  | 'isSystem'
  | 'deletedAt'
  | 'createdAt'
  | 'updatedAt'
>;

export type UpdateChartOfAccountInput = {
  name: string;
  financialGroupId: string;
  availableForPdv: boolean;
};

/**
 * Conta do plano de contas: para onde o lançamento é classificado.
 *
 * O nome é único por organização e a conta pertence a um grupo financeiro, que
 * é quem define se ela é de receita ou de despesa.
 */
export class ChartOfAccount extends Entity<ChartOfAccountProps> {
  constructor(props: ChartOfAccountProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    // Validação de formato no DTO HTTP; domínio guarda só invariantes simples.
  }

  public static create(
    props: CreateChartOfAccountProps,
    id?: string,
  ): ChartOfAccount {
    const now = new Date();
    return new ChartOfAccount(
      {
        organizationId: props.organizationId,
        name: props.name.trim(),
        financialGroupId: props.financialGroupId,
        availableForPdv: props.availableForPdv ?? false,
        systemKey: props.systemKey ?? null,
        isSystem: props.isSystem ?? false,
        deletedAt: props.deletedAt ?? null,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }

  public static with(props: ChartOfAccountProps, id: string): ChartOfAccount {
    return new ChartOfAccount(props, id);
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get name() {
    return this.props.name;
  }
  get financialGroupId() {
    return this.props.financialGroupId;
  }
  get availableForPdv() {
    return this.props.availableForPdv;
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

  update(input: UpdateChartOfAccountInput): ChartOfAccount {
    return ChartOfAccount.with(
      {
        ...this.props,
        name: input.name.trim(),
        financialGroupId: input.financialGroupId,
        availableForPdv: input.availableForPdv,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  /**
   * Exclui sem apagar: lançamentos já classificados apontam para a conta, e o
   * histórico financeiro precisa continuar resolvendo o nome dela.
   */
  softDelete(): ChartOfAccount {
    const now = new Date();
    return ChartOfAccount.with(
      { ...this.props, deletedAt: now, updatedAt: now },
      this.id,
    );
  }

  restore(): ChartOfAccount {
    return ChartOfAccount.with(
      { ...this.props, deletedAt: null, updatedAt: new Date() },
      this.id,
    );
  }
}
