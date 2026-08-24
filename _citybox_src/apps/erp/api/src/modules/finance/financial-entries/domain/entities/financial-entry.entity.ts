import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';
import {
  normalizeFinancialEntryPayments,
  sumFinancialEntryPayments,
  type FinancialEntryPayment,
  type FinancialEntryPaymentInput,
} from './financial-entry-payment.entity';
import {
  normalizeFinancialEntryAllocations,
  type FinancialEntryAllocation,
  type FinancialEntryAllocationInput,
} from './financial-entry-allocation.entity';
import type { FinancialEntryAttachment } from './financial-entry-attachment.entity';
import { assertAllocationsMatchTotal } from '../validators/allocations.validator';
import { FinancialEntryPartyConflictError } from '../errors/financial-entry-party-conflict.error';
import { SaleOrderLinkedEntryForbiddenError } from '../errors/sale-order-linked-entry-forbidden.error';

export const FINANCIAL_ENTRY_OPERATIONS = ['receivable', 'payable'] as const;
export type FinancialEntryOperation =
  (typeof FINANCIAL_ENTRY_OPERATIONS)[number];

export const FINANCIAL_ENTRY_STATUSES = ['pending', 'paid'] as const;
export type FinancialEntryStatus = (typeof FINANCIAL_ENTRY_STATUSES)[number];

export type FinancialEntryProps = {
  organizationId: string;
  operation: FinancialEntryOperation;
  description: string;
  amountCents: number;
  feesCents: number;
  finesCents: number;
  /** Cache recalculado a partir de `sum(payments[].amountCents)` — ver `recomputeAggregates`. */
  paidCents: number;
  /** Derivado — ver `recomputeAggregates`. */
  status: FinancialEntryStatus;
  competenceDate: Date;
  dueDate: Date;
  partyName: string;
  customerId: string | null;
  /** Mutuamente exclusivo com `customerId`. */
  supplierId: string | null;
  bankAccountId: string | null;
  /** Não editável pelo formulário — só o fechamento de `SaleOrder` preenche. */
  saleOrderId: string | null;
  /** Mantida por compatibilidade histórica (pré-rateio) — nenhum código novo lê/escreve. */
  categoryName: string;
  note: string;
  /**
   * Motor de recebíveis do contrato de cartões
   * (`specs/erp/005-card-receivables-engine/`) — nunca editáveis pelo
   * formulário, mesma regra de `saleOrderId` (sempre presente junto: todo
   * lançamento com um destes setados também tem `saleOrderId`, logo já é
   * `isReadOnly`). `null`/`false` em lançamentos manuais e em vendas
   * fechadas antes desta entrega.
   */
  grossAmountCents: number | null;
  acquirerFeeCents: number | null;
  cardContractId: string | null;
  cardPaymentMethodId: string | null;
  saleOrderPaymentId: string | null;
  installmentSequence: number | null;
  installmentCount: number | null;
  cardSettlementFallback: boolean;
  payments: FinancialEntryPayment[];
  allocations: FinancialEntryAllocation[];
  /**
   * Comprovantes anexados — coleção só de leitura na entidade: upload/remoção
   * têm CRUD HTTP próprio (`FinancialEntryAttachmentRepository`) e não passam
   * por `create()`/`update()`. Populada pelo repositório ao carregar.
   */
  attachments: FinancialEntryAttachment[];
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type CreateFinancialEntryProps = Optional<
  Omit<
    FinancialEntryProps,
    'payments' | 'allocations' | 'attachments' | 'paidCents' | 'status'
  >,
  | 'description'
  | 'feesCents'
  | 'finesCents'
  | 'partyName'
  | 'customerId'
  | 'supplierId'
  | 'bankAccountId'
  | 'saleOrderId'
  | 'categoryName'
  | 'note'
  | 'grossAmountCents'
  | 'acquirerFeeCents'
  | 'cardContractId'
  | 'cardPaymentMethodId'
  | 'saleOrderPaymentId'
  | 'installmentSequence'
  | 'installmentCount'
  | 'cardSettlementFallback'
  | 'deletedAt'
  | 'createdAt'
  | 'updatedAt'
> & {
  payments?: FinancialEntryPaymentInput[];
  allocations: FinancialEntryAllocationInput[];
};

export type UpdateFinancialEntryInput = {
  operation: FinancialEntryOperation;
  description?: string;
  amountCents: number;
  feesCents?: number;
  finesCents?: number;
  competenceDate: Date;
  dueDate: Date;
  partyName?: string;
  customerId?: string | null;
  supplierId?: string | null;
  bankAccountId?: string | null;
  categoryName?: string;
  note?: string;
  payments?: FinancialEntryPaymentInput[];
  allocations: FinancialEntryAllocationInput[];
};

/** `totalCents` nunca é persistido — sempre `amountCents + feesCents + finesCents`. */
function computeTotalCents(props: {
  amountCents: number;
  feesCents: number;
  finesCents: number;
}): number {
  return props.amountCents + props.feesCents + props.finesCents;
}

/**
 * Recalcula `paidCents`/`status` a partir das linhas de pagamento — nunca
 * aceitos brutos do cliente. Uma única fonte de verdade (as linhas) evita que
 * o agregado divirja delas.
 */
function recomputeAggregates(
  totalCents: number,
  payments: readonly FinancialEntryPayment[],
): { paidCents: number; status: FinancialEntryStatus } {
  const paidCents = sumFinancialEntryPayments(payments);
  const status: FinancialEntryStatus =
    totalCents > 0 && paidCents >= totalCents ? 'paid' : 'pending';
  return { paidCents, status };
}

/**
 * Lançamento financeiro — um recebível ou um pagável do contas a pagar/receber.
 *
 * O `saleOrderId` não é editável pelo formulário: quem o preenche é o
 * fechamento do pedido de venda. Quando presente, o lançamento inteiro fica
 * somente-leitura (`isReadOnly`) — reescrevê-lo pela tela romperia o rastro
 * entre a venda e o dinheiro que ela gerou. Exclusão/restauração continuam
 * permitidas mesmo nesse caso.
 *
 * `payments`/`allocations` são coleções filhas embutidas, substituídas por
 * completo a cada `save()` (sem identidade estável para o cliente entre
 * saves) — mesmo padrão de `SaleOrder.lines`/`.payments`.
 */
export class FinancialEntry extends Entity<FinancialEntryProps> {
  constructor(props: FinancialEntryProps, id?: string) {
    super(props, id);
    this.validate();
  }

  /**
   * Só invariantes que **toda** instância precisa satisfazer, inclusive
   * reconstruída de dados já persistidos (`with`) — por isso não checa o
   * rateio aqui. Lançamentos legados (de antes desta funcionalidade) podem
   * ter zero linhas de rateio até o backfill rodar; se a soma fosse conferida
   * no construtor, `with()` derrubaria a listagem inteira ao topar com um
   * deles. A checagem de soma só faz sentido para uma escrita nova — ver
   * `create`/`update`.
   */
  protected validate(): void {
    if (this.props.customerId && this.props.supplierId) {
      throw new FinancialEntryPartyConflictError();
    }
  }

  public static create(
    props: CreateFinancialEntryProps,
    id?: string,
  ): FinancialEntry {
    const now = new Date();
    const amountCents = props.amountCents;
    const feesCents = props.feesCents ?? 0;
    const finesCents = props.finesCents ?? 0;
    const payments = normalizeFinancialEntryPayments(props.payments);
    const allocations = normalizeFinancialEntryAllocations(props.allocations);
    const totalCents = computeTotalCents({
      amountCents,
      feesCents,
      finesCents,
    });
    const { paidCents, status } = recomputeAggregates(totalCents, payments);
    assertAllocationsMatchTotal(allocations, totalCents);

    return new FinancialEntry(
      {
        organizationId: props.organizationId,
        operation: props.operation,
        description: props.description?.trim() ?? '',
        amountCents,
        feesCents,
        finesCents,
        paidCents,
        status,
        competenceDate: props.competenceDate,
        dueDate: props.dueDate,
        partyName: props.partyName?.trim() ?? '',
        customerId: props.customerId ?? null,
        supplierId: props.supplierId ?? null,
        bankAccountId: props.bankAccountId ?? null,
        saleOrderId: props.saleOrderId ?? null,
        categoryName: props.categoryName?.trim() ?? '',
        note: props.note?.trim() ?? '',
        grossAmountCents: props.grossAmountCents ?? null,
        acquirerFeeCents: props.acquirerFeeCents ?? null,
        cardContractId: props.cardContractId ?? null,
        cardPaymentMethodId: props.cardPaymentMethodId ?? null,
        saleOrderPaymentId: props.saleOrderPaymentId ?? null,
        installmentSequence: props.installmentSequence ?? null,
        installmentCount: props.installmentCount ?? null,
        cardSettlementFallback: props.cardSettlementFallback ?? false,
        payments,
        allocations,
        // Novo lançamento nasce sem anexos — só existem depois que o `id`
        // existe, via o endpoint dedicado de upload.
        attachments: [],
        deletedAt: props.deletedAt ?? null,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }

  public static with(props: FinancialEntryProps, id: string): FinancialEntry {
    return new FinancialEntry(props, id);
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get operation() {
    return this.props.operation;
  }
  get description() {
    return this.props.description;
  }
  get amountCents() {
    return this.props.amountCents;
  }
  get feesCents() {
    return this.props.feesCents;
  }
  get finesCents() {
    return this.props.finesCents;
  }
  /** Nunca persistido — sempre `amountCents + feesCents + finesCents`. */
  get totalCents() {
    return computeTotalCents(this.props);
  }
  get paidCents() {
    return this.props.paidCents;
  }
  get status() {
    return this.props.status;
  }
  get competenceDate() {
    return this.props.competenceDate;
  }
  get dueDate() {
    return this.props.dueDate;
  }
  get partyName() {
    return this.props.partyName;
  }
  get customerId() {
    return this.props.customerId;
  }
  get supplierId() {
    return this.props.supplierId;
  }
  get bankAccountId() {
    return this.props.bankAccountId;
  }
  get saleOrderId() {
    return this.props.saleOrderId;
  }
  get categoryName() {
    return this.props.categoryName;
  }
  get note() {
    return this.props.note;
  }
  get grossAmountCents() {
    return this.props.grossAmountCents;
  }
  get acquirerFeeCents() {
    return this.props.acquirerFeeCents;
  }
  get cardContractId() {
    return this.props.cardContractId;
  }
  get cardPaymentMethodId() {
    return this.props.cardPaymentMethodId;
  }
  get saleOrderPaymentId() {
    return this.props.saleOrderPaymentId;
  }
  get installmentSequence() {
    return this.props.installmentSequence;
  }
  get installmentCount() {
    return this.props.installmentCount;
  }
  get cardSettlementFallback() {
    return this.props.cardSettlementFallback;
  }
  get payments(): readonly FinancialEntryPayment[] {
    return this.props.payments;
  }
  get allocations(): readonly FinancialEntryAllocation[] {
    return this.props.allocations;
  }
  get attachments(): readonly FinancialEntryAttachment[] {
    return this.props.attachments;
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

  /** Somente-leitura quando vinculado a um pedido de venda (FR-016). */
  get isReadOnly(): boolean {
    return this.props.saleOrderId !== null;
  }

  /**
   * Semântica PUT: o formulário manda o lançamento inteiro, então campo
   * omitido volta ao vazio em vez de conservar o valor antigo. `saleOrderId`
   * é a exceção — vem do pedido de venda, não da tela — e, quando presente,
   * bloqueia a edição por completo.
   */
  update(input: UpdateFinancialEntryInput): FinancialEntry {
    if (this.isReadOnly) {
      throw new SaleOrderLinkedEntryForbiddenError(this.id);
    }

    const amountCents = input.amountCents;
    const feesCents = input.feesCents ?? 0;
    const finesCents = input.finesCents ?? 0;
    const payments = normalizeFinancialEntryPayments(input.payments);
    const allocations = normalizeFinancialEntryAllocations(input.allocations);
    const totalCents = computeTotalCents({
      amountCents,
      feesCents,
      finesCents,
    });
    const { paidCents, status } = recomputeAggregates(totalCents, payments);
    assertAllocationsMatchTotal(allocations, totalCents);

    return FinancialEntry.with(
      {
        ...this.props,
        operation: input.operation,
        description: input.description?.trim() ?? '',
        amountCents,
        feesCents,
        finesCents,
        paidCents,
        status,
        competenceDate: input.competenceDate,
        dueDate: input.dueDate,
        partyName: input.partyName?.trim() ?? '',
        customerId: input.customerId ?? null,
        supplierId: input.supplierId ?? null,
        bankAccountId: input.bankAccountId ?? null,
        categoryName: input.categoryName?.trim() ?? '',
        note: input.note?.trim() ?? '',
        payments,
        allocations,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  /**
   * Exclui sem apagar: o lançamento entra em relatórios já fechados e pode ter
   * parcelas de contrato apontando para ele. Permitido mesmo quando somente-
   * leitura por venda (FR-017).
   */
  softDelete(): FinancialEntry {
    const now = new Date();
    return FinancialEntry.with(
      { ...this.props, deletedAt: now, updatedAt: now },
      this.id,
    );
  }

  restore(): FinancialEntry {
    return FinancialEntry.with(
      { ...this.props, deletedAt: null, updatedAt: new Date() },
      this.id,
    );
  }

  /**
   * Adiciona uma linha de pagamento e recalcula `paidCents`/`status` — usado
   * por `006-bank-reconciliation` ao conciliar (FR-029). Permitido mesmo em
   * lançamento `isReadOnly` (vinculado a venda) de propósito: FR-021 dessa
   * feature separa "dados descritivos" (bloqueados) de "status de pagamento"
   * (permitido) — `update()` continua bloqueado para o resto dos campos.
   */
  addPayment(payment: FinancialEntryPaymentInput): FinancialEntry {
    const [normalizedPayment] = normalizeFinancialEntryPayments([payment]);
    const payments = [...this.props.payments, normalizedPayment];
    const { paidCents, status } = recomputeAggregates(
      this.totalCents,
      payments,
    );
    return FinancialEntry.with(
      { ...this.props, payments, paidCents, status, updatedAt: new Date() },
      this.id,
    );
  }

  /**
   * Remove uma linha de pagamento por id e recalcula `paidCents`/`status` —
   * usado ao desfazer uma conciliação (FR-020/FR-030). Mesmo raciocínio de
   * `addPayment`: permitido mesmo em lançamento `isReadOnly`.
   */
  removePayment(paymentId: string): FinancialEntry {
    const exists = this.props.payments.some(
      (payment) => payment.id === paymentId,
    );
    if (!exists) {
      throw new Error(
        `FinancialEntry ${this.id} has no payment ${paymentId} to remove`,
      );
    }
    const payments = this.props.payments.filter(
      (payment) => payment.id !== paymentId,
    );
    const { paidCents, status } = recomputeAggregates(
      this.totalCents,
      payments,
    );
    return FinancialEntry.with(
      { ...this.props, payments, paidCents, status, updatedAt: new Date() },
      this.id,
    );
  }
}
