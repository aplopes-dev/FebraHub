import { Entity } from '../../../../shared/core/entity';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';

export const INVENTORY_STATUSES = ['open', 'completed'] as const;
export type InventoryStatus = (typeof INVENTORY_STATUSES)[number];

export type InventoryLineProps = {
  productId: string;
  /** Quantidade do sistema no momento da contagem (Decimal string). */
  systemQuantity: string;
  /** Quantidade física contada (Decimal string). */
  countedQuantity: string;
};

export type InventoryProps = {
  organizationId: string;
  stockId: string;
  name: string;
  status: InventoryStatus;
  completedAt: Date | null;
  createdAt: Date;
  lines: InventoryLineProps[];
};

export type CreateInventoryProps = {
  organizationId: string;
  stockId: string;
  name: string;
  status?: InventoryStatus;
  completedAt?: Date | null;
  lines: InventoryLineProps[];
};

/**
 * Quantidade contada pelo operador: nunca negativa — não existe contar −3 itens
 * na prateleira.
 */
function normalizeCountedQuantity(raw: string): string {
  const trimmed = raw.trim();
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) {
    throw new ValidatorDomainError({
      internalMessage: `Invalid inventory countedQuantity: ${raw}`,
      externalMessage: 'A quantidade contada não pode ser negativa.',
      context: 'Inventory',
    });
  }
  return trimmed;
}

/**
 * Saldo do sistema no momento da contagem: é um **snapshot do ledger**, não
 * entrada do usuário, e o ledger admite saldo negativo de propósito (saída sem
 * estoque suficiente é permitida). Validar como não-negativo bloqueava o
 * inventário exatamente no caso em que ele é necessário — corrigir um saldo
 * negativo — e ainda culpava a quantidade contada na mensagem de erro.
 */
function normalizeSystemQuantity(raw: string): string {
  const trimmed = raw.trim();
  const n = Number(trimmed);
  if (!Number.isFinite(n)) {
    throw new ValidatorDomainError({
      internalMessage: `Invalid inventory systemQuantity: ${raw}`,
      externalMessage: 'Não foi possível ler o saldo atual do produto.',
      context: 'Inventory',
    });
  }
  return trimmed;
}

/**
 * Contagem física de inventário.
 *
 * Nesta fase o create já grava `completed` e aplica deltas no ledger.
 */
export class Inventory extends Entity<InventoryProps> {
  constructor(props: InventoryProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    if (!this.props.name.trim()) {
      throw new ValidatorDomainError({
        internalMessage: 'Inventory without name',
        externalMessage: 'Informe o nome do inventário.',
        context: Inventory.name,
      });
    }
    if (this.props.lines.length === 0) {
      throw new ValidatorDomainError({
        internalMessage: 'Inventory without lines',
        externalMessage: 'Informe ao menos um produto na contagem.',
        context: Inventory.name,
      });
    }

    const seen = new Set<string>();
    for (const line of this.props.lines) {
      if (!line.productId) {
        throw new ValidatorDomainError({
          internalMessage: 'Inventory line without productId',
          externalMessage: 'Produto inválido na linha do inventário.',
          context: Inventory.name,
        });
      }
      if (seen.has(line.productId)) {
        throw new ValidatorDomainError({
          internalMessage: `Duplicate productId in inventory: ${line.productId}`,
          externalMessage:
            'Cada produto deve aparecer apenas uma vez no inventário.',
          context: Inventory.name,
        });
      }
      seen.add(line.productId);
      normalizeSystemQuantity(line.systemQuantity);
      normalizeCountedQuantity(line.countedQuantity);
    }
  }

  public static create(props: CreateInventoryProps, id?: string): Inventory {
    const now = new Date();
    const status = props.status ?? 'completed';
    return new Inventory(
      {
        organizationId: props.organizationId,
        stockId: props.stockId,
        name: props.name.trim(),
        status,
        completedAt:
          props.completedAt !== undefined
            ? props.completedAt
            : status === 'completed'
              ? now
              : null,
        createdAt: now,
        lines: props.lines.map((line) => ({
          productId: line.productId,
          systemQuantity: normalizeSystemQuantity(line.systemQuantity),
          countedQuantity: normalizeCountedQuantity(line.countedQuantity),
        })),
      },
      id,
    );
  }

  public static with(props: InventoryProps, id: string): Inventory {
    return new Inventory(props, id);
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get stockId() {
    return this.props.stockId;
  }
  get name() {
    return this.props.name;
  }
  get status() {
    return this.props.status;
  }
  get completedAt() {
    return this.props.completedAt;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get lines() {
    return this.props.lines;
  }

  get itemsCount() {
    return this.props.lines.length;
  }

  get divergentCount() {
    return this.props.lines.filter(
      (line) => Number(line.countedQuantity) !== Number(line.systemQuantity),
    ).length;
  }
}
