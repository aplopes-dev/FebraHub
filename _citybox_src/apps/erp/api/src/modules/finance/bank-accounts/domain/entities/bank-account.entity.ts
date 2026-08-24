import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';

export type BankAccountProps = {
  organizationId: string;
  name: string;
  bankName: string;
  /** Identificador estável do catálogo de bancos do frontend — round-trip do `Select` (FR-015). */
  bankCode: string;
  openingBalanceCents: number;
  openedAt: Date;
  branchIds: string[];
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type CreateBankAccountProps = Optional<
  BankAccountProps,
  | 'bankName'
  | 'bankCode'
  | 'openingBalanceCents'
  | 'branchIds'
  | 'deletedAt'
  | 'createdAt'
  | 'updatedAt'
>;

export type UpdateBankAccountInput = {
  name: string;
  bankName?: string;
  bankCode?: string;
  openingBalanceCents?: number;
  openedAt: Date;
  branchIds?: string[];
};

/**
 * Conta bancária da organização — a conta virtual onde os lançamentos
 * financeiros são recebidos ou pagos.
 *
 * Diferente dos outros cadastros de finanças, o nome **não** é único: duas
 * agências do mesmo banco podem legitimamente chamar "Caixa operacional", e o
 * que distingue as contas para o operador é o banco somado à unidade atendida.
 */
export class BankAccount extends Entity<BankAccountProps> {
  constructor(props: BankAccountProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    // Validação de formato no DTO HTTP; domínio guarda só invariantes simples.
  }

  public static create(
    props: CreateBankAccountProps,
    id?: string,
  ): BankAccount {
    const now = new Date();
    return new BankAccount(
      {
        organizationId: props.organizationId,
        name: props.name.trim(),
        bankName: props.bankName?.trim() ?? '',
        bankCode: props.bankCode?.trim() ?? '',
        openingBalanceCents: props.openingBalanceCents ?? 0,
        openedAt: props.openedAt,
        branchIds: [...(props.branchIds ?? [])],
        deletedAt: props.deletedAt ?? null,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }

  public static with(props: BankAccountProps, id: string): BankAccount {
    return new BankAccount(props, id);
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get name() {
    return this.props.name;
  }
  get bankName() {
    return this.props.bankName;
  }
  get bankCode() {
    return this.props.bankCode;
  }
  get openingBalanceCents() {
    return this.props.openingBalanceCents;
  }
  get openedAt() {
    return this.props.openedAt;
  }
  get branchIds() {
    return this.props.branchIds;
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

  /**
   * Semântica PUT: o formulário manda o cadastro inteiro, então campo omitido
   * volta ao vazio em vez de conservar o valor antigo.
   */
  update(input: UpdateBankAccountInput): BankAccount {
    return BankAccount.with(
      {
        ...this.props,
        name: input.name.trim(),
        bankName: input.bankName?.trim() ?? '',
        bankCode: input.bankCode?.trim() ?? '',
        openingBalanceCents: input.openingBalanceCents ?? 0,
        openedAt: input.openedAt,
        branchIds: [...(input.branchIds ?? [])],
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  /**
   * Desativa a conta sem apagá-la: lançamentos e pagamentos de venda já
   * registrados apontam para ela, e o extrato precisa continuar resolvendo.
   */
  softDelete(): BankAccount {
    const now = new Date();
    return BankAccount.with(
      { ...this.props, deletedAt: now, updatedAt: now },
      this.id,
    );
  }

  restore(): BankAccount {
    return BankAccount.with(
      { ...this.props, deletedAt: null, updatedAt: new Date() },
      this.id,
    );
  }
}
