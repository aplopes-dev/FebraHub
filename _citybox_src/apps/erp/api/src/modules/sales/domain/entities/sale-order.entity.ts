import { Entity } from '../../../../shared/core/entity';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';

export const SALE_ORDER_STATUSES = [
  'open',
  'closed',
  'cancelled',
  'preparing',
  'delivering',
  'reserved',
  'waiting',
  'pickup',
] as const;
export type SaleOrderStatus = (typeof SALE_ORDER_STATUSES)[number];

export const SALE_ORDER_CHANNELS = [
  'pdv',
  'delivery',
  'marketplace',
  'cardapio',
] as const;
export type SaleOrderChannel = (typeof SALE_ORDER_CHANNELS)[number];

/**
 * `productId`/`description` são mutuamente exclusivos (spec erp/031 D1):
 * linha de produto de catálogo (`productId` preenchido, `description` null)
 * ou linha de serviço sem vínculo de catálogo (`productId` null,
 * `description` obrigatória como rótulo). Reforçado por `normalizeLines()` e
 * por um `CHECK` no banco (defesa em profundidade).
 */
export type SaleOrderLineProps = {
  productId: string | null;
  description: string | null;
  /** Quantidade Decimal string. */
  quantity: string;
  unitPriceCents: number;
};

/**
 * Espelha o enum Prisma `CardPaymentMethodType` (`pix|debit|credit`) sem
 * importá-lo — o domínio de `sales` não depende de Prisma nem de
 * `finance/card-contracts` (mesmos valores de string, checados no boundary
 * de infraestrutura). `undefined`/ausente = pagamento não-cartão (dinheiro,
 * boleto, transferência) — motor de recebíveis não se aplica.
 */
export const SALE_ORDER_CARD_PAYMENT_TYPES = [
  'pix',
  'debit',
  'credit',
] as const;
export type SaleOrderCardPaymentType =
  (typeof SALE_ORDER_CARD_PAYMENT_TYPES)[number];

export type SaleOrderPaymentProps = {
  id?: string;
  amountCents: number;
  methodId: string;
  bankAccountId: string | null;
  /** Discriminador estrutural para o motor de recebíveis — ver `SaleOrderCardPaymentType`. */
  cardPaymentType?: SaleOrderCardPaymentType;
  /** Bandeira do cartão (catálogo fixo compartilhado no frontend). `null`/ausente para Pix e não-cartão. */
  brand?: string | null;
  /** Nº de parcelas do crédito. Irrelevante para débito/Pix. */
  installments?: number;
};

export type SaleOrderProps = {
  organizationId: string;
  /** Sequencial por organização, atribuído uma vez na criação. */
  number: number;
  customerId: string | null;
  /** Denormalizado — permite busca sem join e cobre cliente avulso (sem cadastro). */
  customerName: string;
  /** CPF/CNPJ na nota (só dígitos, 11 ou 14). Null = sem identificação. */
  consumerDocument: string | null;
  stockId: string | null;
  status: SaleOrderStatus;
  channelId: SaleOrderChannel;
  sellerId: string | null;
  sellerName: string;
  createdByName: string;
  notes: string;
  deliveryFeeCents: number;
  discountsCents: number;
  /** Idempotência: id do StockMovement de saída já gerado (ou null). */
  stockMovementId: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lines: SaleOrderLineProps[];
  payments: SaleOrderPaymentProps[];
};

type SaleOrderLineInput = {
  productId?: string | null;
  description?: string | null;
  quantity: string;
  unitPriceCents: number;
};

type SaleOrderPaymentInput = {
  id?: string;
  amountCents: number;
  methodId: string;
  bankAccountId?: string | null;
  cardPaymentType?: SaleOrderCardPaymentType;
  brand?: string | null;
  installments?: number;
};

export type CreateSaleOrderProps = {
  organizationId: string;
  number: number;
  customerId?: string | null;
  customerName: string;
  consumerDocument?: string | null;
  stockId?: string | null;
  status?: SaleOrderStatus;
  channelId?: SaleOrderChannel;
  sellerId?: string | null;
  sellerName?: string;
  createdByName: string;
  notes?: string;
  deliveryFeeCents?: number;
  discountsCents?: number;
  lines: SaleOrderLineInput[];
  payments?: SaleOrderPaymentInput[];
};

/**
 * Campos que o formulário edita (semântica de PUT). `number`, `stockMovementId`
 * e `deletedAt` ficam fora: numeração e idempotência do ledger têm fluxo
 * próprio, exclusão tem fluxo próprio.
 */
export type UpdateSaleOrderInput = {
  customerId?: string | null;
  customerName: string;
  consumerDocument?: string | null;
  stockId?: string | null;
  status: SaleOrderStatus;
  channelId?: SaleOrderChannel;
  sellerId?: string | null;
  sellerName?: string;
  notes?: string;
  deliveryFeeCents?: number;
  discountsCents?: number;
  lines: SaleOrderLineInput[];
  payments?: SaleOrderPaymentInput[];
};

/** CPF (11) ou CNPJ (14) só dígitos; vazio → null. */
function normalizeConsumerDocument(
  raw: string | null | undefined,
): string | null {
  if (raw == null) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 0) return null;
  if (digits.length !== 11 && digits.length !== 14) {
    throw new ValidatorDomainError({
      internalMessage: `Invalid consumerDocument length: ${digits.length}`,
      externalMessage:
        'Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.',
      context: 'SaleOrder',
    });
  }
  return digits;
}

function normalizePositiveQuantity(raw: string): string {
  const trimmed = raw.trim();
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n <= 0) {
    throw new ValidatorDomainError({
      internalMessage: `Invalid sale order line quantity: ${raw}`,
      externalMessage: 'A quantidade de cada item deve ser maior que zero.',
      context: 'SaleOrder',
    });
  }
  return trimmed;
}

function normalizeMoneyCents(raw: number, field: string): number {
  if (!Number.isInteger(raw) || raw < 0) {
    throw new ValidatorDomainError({
      internalMessage: `Invalid sale order ${field}: ${raw}`,
      externalMessage: 'Os valores do pedido não podem ser negativos.',
      context: 'SaleOrder',
    });
  }
  return raw;
}

function normalizeLines(lines: SaleOrderLineInput[]): SaleOrderLineProps[] {
  const seen = new Set<string>();
  return lines.map((line) => {
    const productId = line.productId?.trim() || null;
    const description = line.description?.trim() || null;

    if (!productId && !description) {
      throw new ValidatorDomainError({
        internalMessage:
          'Sale order line without productId and without description',
        externalMessage:
          'Cada linha do pedido precisa de um produto ou de uma descrição de serviço.',
        context: 'SaleOrder',
      });
    }
    if (productId && description) {
      throw new ValidatorDomainError({
        internalMessage: 'Sale order line with both productId and description',
        externalMessage:
          'Uma linha do pedido não pode ter produto de catálogo e descrição de serviço ao mesmo tempo.',
        context: 'SaleOrder',
      });
    }
    if (productId) {
      if (seen.has(productId)) {
        throw new ValidatorDomainError({
          internalMessage: `Duplicate productId in sale order: ${productId}`,
          externalMessage:
            'Cada produto deve aparecer apenas uma vez no pedido.',
          context: 'SaleOrder',
        });
      }
      seen.add(productId);
    }

    return {
      productId,
      description,
      quantity: normalizePositiveQuantity(line.quantity),
      unitPriceCents: normalizeMoneyCents(
        line.unitPriceCents,
        'unitPriceCents',
      ),
    };
  });
}

/**
 * Pix nunca tem bandeira (RN-11) — força `null` mesmo se o cliente enviar
 * algo. Débito/crédito exigem bandeira (necessária para o motor de
 * recebíveis resolver o método do contrato por `type`+`brand`). Pagamentos
 * sem `cardPaymentType` (dinheiro, boleto, transferência) não têm bandeira —
 * passa o valor adiante sem exigir nada.
 */
function normalizePaymentBrand(
  cardPaymentType: SaleOrderCardPaymentType | undefined,
  rawBrand: string | null | undefined,
): string | null | undefined {
  if (cardPaymentType === 'pix') return null;

  if (cardPaymentType === 'debit' || cardPaymentType === 'credit') {
    const trimmed = rawBrand?.trim();
    if (!trimmed) {
      throw new ValidatorDomainError({
        internalMessage: `Sale order payment (${cardPaymentType}) without brand`,
        externalMessage: 'Informe a bandeira do cartão.',
        context: 'SaleOrder',
      });
    }
    return trimmed;
  }

  return rawBrand;
}

/** Só relevante para crédito parcelado — quando informado, precisa ser >= 1. */
function normalizePaymentInstallments(
  raw: number | undefined,
): number | undefined {
  if (raw === undefined) return undefined;
  if (!Number.isInteger(raw) || raw < 1) {
    throw new ValidatorDomainError({
      internalMessage: `Invalid sale order payment installments: ${raw}`,
      externalMessage: 'O número de parcelas deve ser maior ou igual a 1.',
      context: 'SaleOrder',
    });
  }
  return raw;
}

function normalizePayments(
  payments: SaleOrderPaymentInput[],
): SaleOrderPaymentProps[] {
  return payments.map((payment) => {
    if (!payment.methodId?.trim()) {
      throw new ValidatorDomainError({
        internalMessage: 'Sale order payment without methodId',
        externalMessage: 'Informe a forma de pagamento.',
        context: 'SaleOrder',
      });
    }
    return {
      id: payment.id,
      amountCents: normalizeMoneyCents(payment.amountCents, 'amountCents'),
      methodId: payment.methodId.trim(),
      bankAccountId: payment.bankAccountId?.trim() || null,
      cardPaymentType: payment.cardPaymentType,
      brand: normalizePaymentBrand(payment.cardPaymentType, payment.brand),
      installments: normalizePaymentInstallments(payment.installments),
    };
  });
}

/**
 * Pedido/venda (mesma entidade — canal `pdv`/`delivery`/`marketplace`/`cardapio`).
 *
 * Ao fechar (`status=closed`), gera no máximo 1 `StockMovement` de saída
 * (`buildSaleOutboundMovement`), idempotente via `stockMovementId` — só para
 * as linhas cujo produto tem `trackStock=true` (regra F9 §2).
 */
export class SaleOrder extends Entity<SaleOrderProps> {
  constructor(props: SaleOrderProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    if (!SALE_ORDER_STATUSES.includes(this.props.status)) {
      throw new ValidatorDomainError({
        internalMessage: `Invalid SaleOrder status ${this.props.status}`,
        externalMessage: 'Situação do pedido inválida.',
        context: SaleOrder.name,
      });
    }
    if (!SALE_ORDER_CHANNELS.includes(this.props.channelId)) {
      throw new ValidatorDomainError({
        internalMessage: `Invalid SaleOrder channelId ${this.props.channelId}`,
        externalMessage: 'Canal do pedido inválido.',
        context: SaleOrder.name,
      });
    }
    if (!this.props.customerName.trim()) {
      throw new ValidatorDomainError({
        internalMessage: 'SaleOrder without customerName',
        externalMessage: 'Informe o nome do cliente.',
        context: SaleOrder.name,
      });
    }
    if (this.props.consumerDocument != null) {
      normalizeConsumerDocument(this.props.consumerDocument);
    }
    if (this.props.lines.length === 0) {
      throw new ValidatorDomainError({
        internalMessage: 'SaleOrder without lines',
        externalMessage: 'Informe ao menos um produto no pedido.',
        context: SaleOrder.name,
      });
    }

    const seen = new Set<string>();
    for (const line of this.props.lines) {
      if (!line.productId && !line.description) {
        throw new ValidatorDomainError({
          internalMessage:
            'Sale order line without productId and without description',
          externalMessage:
            'Cada linha do pedido precisa de um produto ou de uma descrição de serviço.',
          context: SaleOrder.name,
        });
      }
      if (line.productId && line.description) {
        throw new ValidatorDomainError({
          internalMessage:
            'Sale order line with both productId and description',
          externalMessage:
            'Uma linha do pedido não pode ter produto de catálogo e descrição de serviço ao mesmo tempo.',
          context: SaleOrder.name,
        });
      }
      if (line.productId) {
        if (seen.has(line.productId)) {
          throw new ValidatorDomainError({
            internalMessage: `Duplicate productId in sale order: ${line.productId}`,
            externalMessage:
              'Cada produto deve aparecer apenas uma vez no pedido.',
            context: SaleOrder.name,
          });
        }
        seen.add(line.productId);
      }
      normalizePositiveQuantity(line.quantity);
      normalizeMoneyCents(line.unitPriceCents, 'unitPriceCents');
    }

    for (const payment of this.props.payments) {
      if (!payment.methodId.trim()) {
        throw new ValidatorDomainError({
          internalMessage: 'Sale order payment without methodId',
          externalMessage: 'Informe a forma de pagamento.',
          context: SaleOrder.name,
        });
      }
      normalizeMoneyCents(payment.amountCents, 'amountCents');
    }
  }

  public static create(props: CreateSaleOrderProps, id?: string): SaleOrder {
    const now = new Date();
    return new SaleOrder(
      {
        organizationId: props.organizationId,
        number: props.number,
        customerId: props.customerId?.trim() || null,
        customerName: props.customerName.trim(),
        consumerDocument: normalizeConsumerDocument(props.consumerDocument),
        stockId: props.stockId?.trim() || null,
        status: props.status ?? 'open',
        channelId: props.channelId ?? 'pdv',
        sellerId: props.sellerId?.trim() || null,
        sellerName: (props.sellerName ?? '').trim(),
        createdByName: props.createdByName.trim(),
        notes: (props.notes ?? '').trim(),
        deliveryFeeCents: normalizeMoneyCents(
          props.deliveryFeeCents ?? 0,
          'deliveryFeeCents',
        ),
        discountsCents: normalizeMoneyCents(
          props.discountsCents ?? 0,
          'discountsCents',
        ),
        stockMovementId: null,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
        lines: normalizeLines(props.lines),
        payments: normalizePayments(props.payments ?? []),
      },
      id,
    );
  }

  public static with(props: SaleOrderProps, id: string): SaleOrder {
    return new SaleOrder(props, id);
  }

  /** Substituição completa (PUT) — sempre troca linhas e pagamentos. */
  update(input: UpdateSaleOrderInput): SaleOrder {
    return SaleOrder.with(
      {
        ...this.props,
        customerId: input.customerId?.trim() || null,
        customerName: input.customerName.trim(),
        consumerDocument:
          input.consumerDocument !== undefined
            ? normalizeConsumerDocument(input.consumerDocument)
            : this.props.consumerDocument,
        stockId: input.stockId?.trim() || null,
        status: input.status,
        channelId: input.channelId ?? this.props.channelId,
        sellerId: input.sellerId?.trim() || null,
        sellerName: (input.sellerName ?? '').trim(),
        notes: (input.notes ?? '').trim(),
        deliveryFeeCents: normalizeMoneyCents(
          input.deliveryFeeCents ?? 0,
          'deliveryFeeCents',
        ),
        discountsCents: normalizeMoneyCents(
          input.discountsCents ?? 0,
          'discountsCents',
        ),
        updatedAt: new Date(),
        lines: normalizeLines(input.lines),
        payments: normalizePayments(input.payments ?? []),
      },
      this.id,
    );
  }

  /** Troca só a situação — usado pelo PATCH dedicado de status. */
  updateStatus(status: SaleOrderStatus): SaleOrder {
    return SaleOrder.with(
      { ...this.props, status, updatedAt: new Date() },
      this.id,
    );
  }

  /** Grava o id do movimento de saída gerado — idempotência. */
  withStockMovementId(stockMovementId: string): SaleOrder {
    return SaleOrder.with({ ...this.props, stockMovementId }, this.id);
  }

  softDelete(): SaleOrder {
    const now = new Date();
    return SaleOrder.with(
      { ...this.props, deletedAt: now, updatedAt: now },
      this.id,
    );
  }

  restore(): SaleOrder {
    return SaleOrder.with(
      { ...this.props, deletedAt: null, updatedAt: new Date() },
      this.id,
    );
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get number() {
    return this.props.number;
  }
  get customerId() {
    return this.props.customerId;
  }
  get customerName() {
    return this.props.customerName;
  }
  get consumerDocument() {
    return this.props.consumerDocument;
  }
  get stockId() {
    return this.props.stockId;
  }
  get status() {
    return this.props.status;
  }
  get channelId() {
    return this.props.channelId;
  }
  get sellerId() {
    return this.props.sellerId;
  }
  get sellerName() {
    return this.props.sellerName;
  }
  get createdByName() {
    return this.props.createdByName;
  }
  get notes() {
    return this.props.notes;
  }
  get deliveryFeeCents() {
    return this.props.deliveryFeeCents;
  }
  get discountsCents() {
    return this.props.discountsCents;
  }
  get stockMovementId() {
    return this.props.stockMovementId;
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
  get lines() {
    return this.props.lines;
  }
  get payments() {
    return this.props.payments;
  }

  get itemsCount() {
    return this.props.lines.length;
  }

  /** Soma quantidade × preço unitário de todas as linhas. */
  get linesTotalCents(): number {
    return this.props.lines.reduce((sum, line) => {
      const qty = Number(line.quantity);
      return sum + Math.round(qty * line.unitPriceCents);
    }, 0);
  }

  /** Total do pedido: linhas + frete − descontos. */
  get totalCents(): number {
    return (
      this.linesTotalCents +
      this.props.deliveryFeeCents -
      this.props.discountsCents
    );
  }
}
