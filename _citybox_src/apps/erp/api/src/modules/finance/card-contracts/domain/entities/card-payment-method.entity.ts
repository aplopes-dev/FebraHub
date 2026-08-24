import { randomUUID } from 'crypto';
import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';
import { assertCardRateTiersAreValid } from '../validators/card-rate-tiers.validator';

export const CARD_PAYMENT_METHOD_TYPES = ['pix', 'debit', 'credit'] as const;
export type CardPaymentMethodType = (typeof CARD_PAYMENT_METHOD_TYPES)[number];

/**
 * Faixa progressiva de taxa: de `minInstallments` a `maxInstallments` parcelas,
 * cobra-se `rate`. Value object embutido no método — não tem vida própria fora
 * dele, e é substituído inteiro a cada gravação.
 */
export type CardRateTier = {
  id: string;
  minInstallments: number;
  maxInstallments: number;
  /** Percentual. `number` no domínio; Decimal(9,4) no banco. */
  rate: number;
};

export type CardRateTierInput = Optional<CardRateTier, 'id'>;

export type CardPaymentMethodProps = {
  organizationId: string;
  cardContractId: string;
  type: CardPaymentMethodType;
  brand: string | null;
  rate: number | null;
  feeCents: number | null;
  settlementDays: number | null;
  minInstallments: number | null;
  maxInstallments: number | null;
  firstPaymentDays: number | null;
  daysBetweenInstallments: number | null;
  progressiveEnabled: boolean;
  rateTiers: CardRateTier[];
  createdAt: Date;
  updatedAt: Date;
};

type CreateCardPaymentMethodProps = Optional<
  Omit<CardPaymentMethodProps, 'rateTiers'>,
  | 'brand'
  | 'rate'
  | 'feeCents'
  | 'settlementDays'
  | 'minInstallments'
  | 'maxInstallments'
  | 'firstPaymentDays'
  | 'daysBetweenInstallments'
  | 'progressiveEnabled'
  | 'createdAt'
  | 'updatedAt'
> & { rateTiers?: CardRateTierInput[] };

export type UpdateCardPaymentMethodInput = Omit<
  CardPaymentMethodProps,
  'organizationId' | 'cardContractId' | 'createdAt' | 'updatedAt' | 'rateTiers'
> & { rateTiers: CardRateTierInput[] };

function normalizeTiers(
  progressiveEnabled: boolean,
  tiers: CardRateTierInput[] | undefined,
): CardRateTier[] {
  // Faixa gravada com progressivo desligado deixaria o cadastro afirmando duas
  // coisas contrárias: taxa única no campo `rate` e taxa por faixa na tabela.
  if (!progressiveEnabled) return [];

  return (tiers ?? []).map((tier) => ({
    id: tier.id ?? randomUUID(),
    minInstallments: tier.minInstallments,
    maxInstallments: tier.maxInstallments,
    rate: tier.rate,
  }));
}

/**
 * Forma de pagamento aceita num contrato de cartão (pix, débito ou crédito),
 * com a taxa da operadora e o prazo de repasse.
 *
 * No crédito a taxa pode ser progressiva: em vez de um percentual único, faixas
 * de parcelas (`CardRateTier`). As faixas são validadas na construção, então uma
 * entidade em memória nunca carrega sobreposição.
 */
export class CardPaymentMethod extends Entity<CardPaymentMethodProps> {
  constructor(props: CardPaymentMethodProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    assertCardRateTiersAreValid(this.props.rateTiers);
  }

  public static create(
    props: CreateCardPaymentMethodProps,
    id?: string,
  ): CardPaymentMethod {
    const now = new Date();
    const progressiveEnabled = props.progressiveEnabled ?? false;

    return new CardPaymentMethod(
      {
        organizationId: props.organizationId,
        cardContractId: props.cardContractId,
        type: props.type,
        brand: props.brand?.trim() || null,
        rate: props.rate ?? null,
        feeCents: props.feeCents ?? null,
        settlementDays: props.settlementDays ?? null,
        minInstallments: props.minInstallments ?? null,
        maxInstallments: props.maxInstallments ?? null,
        firstPaymentDays: props.firstPaymentDays ?? null,
        daysBetweenInstallments: props.daysBetweenInstallments ?? null,
        progressiveEnabled,
        rateTiers: normalizeTiers(progressiveEnabled, props.rateTiers),
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }

  public static with(
    props: CardPaymentMethodProps,
    id: string,
  ): CardPaymentMethod {
    return new CardPaymentMethod(props, id);
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get cardContractId() {
    return this.props.cardContractId;
  }
  get type() {
    return this.props.type;
  }
  get brand() {
    return this.props.brand;
  }
  get rate() {
    return this.props.rate;
  }
  get feeCents() {
    return this.props.feeCents;
  }
  get settlementDays() {
    return this.props.settlementDays;
  }
  get minInstallments() {
    return this.props.minInstallments;
  }
  get maxInstallments() {
    return this.props.maxInstallments;
  }
  get firstPaymentDays() {
    return this.props.firstPaymentDays;
  }
  get daysBetweenInstallments() {
    return this.props.daysBetweenInstallments;
  }
  get progressiveEnabled() {
    return this.props.progressiveEnabled;
  }
  get rateTiers(): readonly CardRateTier[] {
    return this.props.rateTiers;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  update(input: UpdateCardPaymentMethodInput): CardPaymentMethod {
    return CardPaymentMethod.with(
      {
        ...this.props,
        ...input,
        brand: input.brand?.trim() || null,
        rateTiers: normalizeTiers(input.progressiveEnabled, input.rateTiers),
        updatedAt: new Date(),
      },
      this.id,
    );
  }
}
