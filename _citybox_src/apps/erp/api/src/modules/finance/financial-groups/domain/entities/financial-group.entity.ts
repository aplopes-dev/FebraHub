import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';

export const FINANCIAL_GROUP_TYPES = ['receita', 'despesa'] as const;
export type FinancialGroupType = (typeof FINANCIAL_GROUP_TYPES)[number];

export const FINANCIAL_GROUP_CLASSIFICATIONS = [
  'resultado',
  'patrimonial',
] as const;
export type FinancialGroupClassification =
  (typeof FINANCIAL_GROUP_CLASSIFICATIONS)[number];

export const FINANCIAL_GROUP_SIGNS = ['positive', 'negative'] as const;
export type FinancialGroupSign = (typeof FINANCIAL_GROUP_SIGNS)[number];

export type FinancialGroupProps = {
  organizationId: string;
  name: string;
  type: FinancialGroupType;
  systemKey: string | null;
  isSystem: boolean;
  /**
   * Se o grupo participa do resultado do período (DRE) ou é patrimonial. Não é
   * um input do formulário HTTP — `CreateFinancialGroupUseCase` nunca lê esse
   * campo do DTO; só o provisionamento/backfill de sistema o define (mesmo
   * padrão de `systemKey`/`isSystem`).
   */
  classification: FinancialGroupClassification;
  /**
   * Ordem fixa na árvore da DRE reestruturada (spec `007-financeiro-ajustes-ui`).
   * Não é input do formulário HTTP — só o seed de sistema preenche. `0` para
   * grupos criados pelo lojista (fora do modelo de 9 categorias fixas).
   */
  catalogOrder: number;
  /**
   * Sinal do grupo no Resultado Operacional. `null` para grupos criados pelo
   * lojista — só os 9 grupos de sistema do modelo novo da DRE têm sinal.
   */
  sign: FinancialGroupSign | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type CreateFinancialGroupProps = Optional<
  FinancialGroupProps,
  | 'systemKey'
  | 'isSystem'
  | 'classification'
  | 'catalogOrder'
  | 'sign'
  | 'deletedAt'
  | 'createdAt'
  | 'updatedAt'
>;

export type UpdateFinancialGroupInput = {
  name: string;
  type: FinancialGroupType;
};

/**
 * Grupo financeiro: a classificação de topo do plano de contas — se o dinheiro
 * entra (`receita`) ou sai (`despesa`).
 *
 * O nome é único por organização entre os não excluídos: um grupo excluído
 * libera o nome de volta, senão o operador ficaria impedido de recriar
 * "Vendas" só porque uma versão antiga está na lixeira.
 */
export class FinancialGroup extends Entity<FinancialGroupProps> {
  constructor(props: FinancialGroupProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    // Validação de formato no DTO HTTP; domínio guarda só invariantes simples.
  }

  public static create(
    props: CreateFinancialGroupProps,
    id?: string,
  ): FinancialGroup {
    const now = new Date();
    return new FinancialGroup(
      {
        organizationId: props.organizationId,
        name: props.name.trim(),
        type: props.type,
        systemKey: props.systemKey ?? null,
        isSystem: props.isSystem ?? false,
        classification: props.classification ?? 'resultado',
        catalogOrder: props.catalogOrder ?? 0,
        sign: props.sign ?? null,
        deletedAt: props.deletedAt ?? null,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }

  public static with(props: FinancialGroupProps, id: string): FinancialGroup {
    return new FinancialGroup(props, id);
  }

  get organizationId() {
    return this.props.organizationId;
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
  get classification() {
    return this.props.classification;
  }
  get catalogOrder() {
    return this.props.catalogOrder;
  }
  get sign() {
    return this.props.sign;
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

  update(input: UpdateFinancialGroupInput): FinancialGroup {
    return FinancialGroup.with(
      {
        ...this.props,
        name: input.name.trim(),
        type: input.type,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  /**
   * Desativa o grupo sem apagá-lo: contas do plano e lançamentos já emitidos
   * apontam para ele, e o histórico precisa continuar resolvendo.
   */
  softDelete(): FinancialGroup {
    const now = new Date();
    return FinancialGroup.with(
      { ...this.props, deletedAt: now, updatedAt: now },
      this.id,
    );
  }

  restore(): FinancialGroup {
    return FinancialGroup.with(
      { ...this.props, deletedAt: null, updatedAt: new Date() },
      this.id,
    );
  }
}
