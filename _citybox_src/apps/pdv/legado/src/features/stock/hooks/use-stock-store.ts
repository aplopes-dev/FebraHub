import { create } from 'zustand';
import { useProductsStore } from '@/features/products/hooks/use-products-store';
import { INITIAL_STOCK_MOVEMENTS } from '../data/mock-stock';
import type {
  StockLevelStatus,
  StockMovement,
  StockReason,
  STOCK_REASON_LABEL,
} from '../types/stock';

type RegisterEntryParams = {
  productId: string;
  quantity: number;
  reason: StockReason;
  unitPriceCents?: number;
  notes?: string;
  operator?: string;
};

type RegisterExitParams = {
  productId: string;
  quantity: number;
  reason: StockReason;
  notes?: string;
  operator?: string;
};

type StockState = {
  movements: StockMovement[];
  minStockLevels: Record<string, number>;
  units: Record<string, string>;

  registerEntry: (params: RegisterEntryParams) => boolean;
  registerExit: (params: RegisterExitParams) => boolean;
  setMinStock: (productId: string, minStock: number) => void;
  getMinStock: (productId: string) => number;
  getUnit: (productId: string) => string;
  getStockStatus: (currentStock: number, minStock: number) => StockLevelStatus;
};

const DEFAULT_MIN_STOCK: Record<string, number> = {
  'PRD-001': 15,
  'PRD-002': 10,
  'PRD-003': 10,
  'PRD-004': 30,
  'PRD-005': 15,
  'PRD-006': 50,
  'PRD-007': 5,
  'PRD-008': 10,
};

const DEFAULT_UNITS: Record<string, string> = {
  'PRD-001': 'un',
  'PRD-002': 'un',
  'PRD-003': 'un',
  'PRD-004': 'porção',
  'PRD-005': 'un',
  'PRD-006': 'lata',
  'PRD-007': 'combo',
  'PRD-008': 'porção',
};

export const useStockStore = create<StockState>((set, get) => ({
  movements: [...INITIAL_STOCK_MOVEMENTS],
  minStockLevels: { ...DEFAULT_MIN_STOCK },
  units: { ...DEFAULT_UNITS },

  registerEntry: ({
    productId,
    quantity,
    reason,
    unitPriceCents,
    notes,
    operator = 'Operador do Sistema',
  }) => {
    if (quantity <= 0) return false;

    const productsStore = useProductsStore.getState();
    const product = productsStore.products.find((p) => p.id === productId);
    if (!product) return false;

    const previousStock = product.stock;
    const newStock = previousStock + quantity;

    // Atualiza produto na store de produtos
    productsStore.updateProduct(productId, {
      ...product,
      stock: newStock,
    });

    const now = new Date();
    const dateFormatted = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const newMovement: StockMovement = {
      id: `MOV-${Date.now().toString().slice(-4)}`,
      productId,
      productName: product.name,
      sku: product.id,
      type: 'entry',
      quantity,
      reason,
      reasonLabel: notes ? `${notes}` : reason,
      date: dateFormatted,
      operator,
      notes,
      unitPriceCents,
      previousStock,
      newStock,
    };

    set((state) => ({
      movements: [newMovement, ...state.movements],
    }));

    return true;
  },

  registerExit: ({
    productId,
    quantity,
    reason,
    notes,
    operator = 'Operador do Sistema',
  }) => {
    if (quantity <= 0) return false;

    const productsStore = useProductsStore.getState();
    const product = productsStore.products.find((p) => p.id === productId);
    if (!product) return false;

    const previousStock = product.stock;
    const newStock = Math.max(0, previousStock - quantity);

    productsStore.updateProduct(productId, {
      ...product,
      stock: newStock,
    });

    const now = new Date();
    const dateFormatted = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const newMovement: StockMovement = {
      id: `MOV-${Date.now().toString().slice(-4)}`,
      productId,
      productName: product.name,
      sku: product.id,
      type: reason === 'ajuste_inventario' ? 'adjustment' : 'exit',
      quantity,
      reason,
      reasonLabel: notes ? `${notes}` : reason,
      date: dateFormatted,
      operator,
      notes,
      previousStock,
      newStock,
    };

    set((state) => ({
      movements: [newMovement, ...state.movements],
    }));

    return true;
  },

  setMinStock: (productId, minStock) =>
    set((state) => ({
      minStockLevels: { ...state.minStockLevels, [productId]: Math.max(0, minStock) },
    })),

  getMinStock: (productId) => get().minStockLevels[productId] ?? 10,

  getUnit: (productId) => get().units[productId] ?? 'un',

  getStockStatus: (currentStock, minStock) => {
    if (currentStock === 0) return 'out_of_stock';
    if (currentStock <= minStock) return 'low_stock';
    return 'in_stock';
  },
}));
