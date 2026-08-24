import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';

export const CARD_CONTRACT_GROUPINGS = [
  'by_card_brand',
  'by_payment_method',
  'no_grouping',
] as const;
export type CardContractGrouping = (typeof CARD_CONTRACT_GROUPINGS)[number];

export const CARD_CUTOFF_PERIODS = ['daily', 'weekly', 'monthly'] as const;
export type CardCutoffPeriod = (typeof CARD_CUTOFF_PERIODS)[number];

export const CARD_DAY_TYPES = ['business_days', 'calendar_days'] as const;
export type CardDayType = (typeof CARD_DAY_TYPES)[number];

export const CARD_INSTALLMENT_DAY_TYPES = [
  'business_days',
  'calendar_days',
  'single_payment',
] as const;
export type CardInstallmentDayType =
  (typeof CARD_INSTALLMENT_DAY_TYPES)[number];

export type CardContractProps = {
  organizationId: string;
  /** Adquirente/operadora do contrato — ex.: "Cielo", "Stone". */
  provider: string;
  /** Conta de destino do repasse. Opcional: contrato pode nascer sem conta. */
  bankAccountId: string | null;
  description: string;
  grouping: CardContractGrouping;
  cutoffPeriod: CardCutoffPeriod;
  firstPaymentDayType: CardDayType;
  installmentDayType: CardInstallmentDayType;
  businessDaysOnly: boolean;
  depositFeeCents: number;
  anticipationPeriods: number;
  /** Percentual de antecipação. `number` no domínio; Decimal(9,4) no banco. */
  anticipationRate: number;
  allEntriesPaidInContract: boolean;
  businessDaysDeposit: boolean;
  active: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type CreateCardContractProps = Optional<
  CardContractProps,
  | 'bankAccountId'
  | 'description'
  | 'grouping'
  | 'cutoffPeriod'
  | 'firstPaymentDayType'
  | 'installmentDayType'
  | 'businessDaysOnly'
  | 'depositFeeCents'
  | 'anticipationPeriods'
  | 'anticipationRate'
  | 'allEntriesPaidInContract'
  | 'businessDaysDeposit'
  | 'active'
  | 'deletedAt'
  | 'createdAt'
  | 'updatedAt'
>;

export type UpdateCardContractInput = Omit<
  CardContractProps,
  'organizationId' | 'deletedAt' | 'createdAt' | 'updatedAt'
>;

/**
 * Contrato de cartão: como a operadora repassa o que foi vendido — corte,
 * prazo de depósito, taxa de antecipação — e onde o dinheiro cai.
 *
 * Os métodos de pagamento (pix/débito/crédito, com suas taxas e faixas) são
 * filhos do contrato e vivem em `CardPaymentMethod`.
 */
export class CardContract extends Entity<CardContractProps> {
  constructor(props: CardContractProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    // Validação de formato no DTO HTTP; domínio guarda só invariantes simples.
  }

  public static create(
    props: CreateCardContractProps,
    id?: string,
  ): CardContract {
    const now = new Date();
    return new CardContract(
      {
        organizationId: props.organizationId,
        provider: props.provider.trim(),
        bankAccountId: props.bankAccountId ?? null,
        description: props.description?.trim() ?? '',
        grouping: props.grouping ?? 'no_grouping',
        cutoffPeriod: props.cutoffPeriod ?? 'daily',
        firstPaymentDayType: props.firstPaymentDayType ?? 'business_days',
        installmentDayType: props.installmentDayType ?? 'business_days',
        businessDaysOnly: props.businessDaysOnly ?? true,
        depositFeeCents: props.depositFeeCents ?? 0,
        anticipationPeriods: props.anticipationPeriods ?? 0,
        anticipationRate: props.anticipationRate ?? 0,
        allEntriesPaidInContract: props.allEntriesPaidInContract ?? false,
        businessDaysDeposit: props.businessDaysDeposit ?? true,
        active: props.active ?? true,
        deletedAt: props.deletedAt ?? null,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }

  public static with(props: CardContractProps, id: string): CardContract {
    return new CardContract(props, id);
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get provider() {
    return this.props.provider;
  }
  get bankAccountId() {
    return this.props.bankAccountId;
  }
  get description() {
    return this.props.description;
  }
  get grouping() {
    return this.props.grouping;
  }
  get cutoffPeriod() {
    return this.props.cutoffPeriod;
  }
  get firstPaymentDayType() {
    return this.props.firstPaymentDayType;
  }
  get installmentDayType() {
    return this.props.installmentDayType;
  }
  get businessDaysOnly() {
    return this.props.businessDaysOnly;
  }
  get depositFeeCents() {
    return this.props.depositFeeCents;
  }
  get anticipationPeriods() {
    return this.props.anticipationPeriods;
  }
  get anticipationRate() {
    return this.props.anticipationRate;
  }
  get allEntriesPaidInContract() {
    return this.props.allEntriesPaidInContract;
  }
  get businessDaysDeposit() {
    return this.props.businessDaysDeposit;
  }
  get active() {
    return this.props.active;
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

  update(input: UpdateCardContractInput): CardContract {
    return CardContract.with(
      {
        ...this.props,
        ...input,
        provider: input.provider.trim(),
        description: input.description.trim(),
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  /**
   * Exclui sem apagar: lançamentos e recebíveis já conciliados apontam para o
   * contrato, e o histórico financeiro precisa continuar resolvendo.
   */
  softDelete(): CardContract {
    const now = new Date();
    return CardContract.with(
      { ...this.props, deletedAt: now, updatedAt: now },
      this.id,
    );
  }

  restore(): CardContract {
    return CardContract.with(
      { ...this.props, deletedAt: null, updatedAt: new Date() },
      this.id,
    );
  }
}
