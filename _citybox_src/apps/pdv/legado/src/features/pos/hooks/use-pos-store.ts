import { create } from 'zustand';
import type { PosCustomer } from '../types/customer';
import type { OrderItem, OrderItemOption, PosOrder } from '../types/order';
import type { PosTable } from '../types/table';
import { PLACEHOLDER_ORDERS } from '../data/placeholder-orders';
import { PLACEHOLDER_CUSTOMERS } from '../data/placeholder-customers';

export type PosDiscount = {
  type: 'new' | 'predefined' | 'percentage' | 'price';
  calculationType: 'percentage' | 'fixed';
  value: number; // percentage (e.g. 15 for 15%) or raw cents (e.g. 500 for R$ 5,00)
  name: string;
  code?: string;
};

type PosStoreState = {
  items: readonly OrderItem[];
  customer: PosCustomer | null;
  activeDiscount: PosDiscount | null;
  tables: readonly PosTable[];
  activeTableId: string | null;
  orders: readonly PosOrder[];
  customers: readonly PosCustomer[];
  addItem: (item: Omit<OrderItem, 'id'>) => void;
  removeItem: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  updateItem: (itemId: string, updatedFields: Omit<OrderItem, 'id'>) => void;
  setCustomer: (customer: PosCustomer | null) => void;
  setDiscount: (discount: PosDiscount | null) => void;
  setTable: (tableId: string | null) => void;
  saveTableOrder: () => void;
  releaseTable: (tableId: string) => void;
  registerOrder: (order: PosOrder) => void;
  deleteOrder: (order: PosOrder) => void;
  addCustomerRecord: (customer: PosCustomer) => void;
  updateCustomerRecord: (customerId: string, updatedFields: Omit<PosCustomer, 'id'>) => void;
  deleteCustomerRecord: (customerId: string) => void;
  clearOrder: () => void;
};

const INITIAL_TABLES: readonly PosTable[] = [
  { id: '1', number: 'Mesa 01', status: 'available', items: [] },
  { id: '2', number: 'Mesa 02', status: 'available', items: [] },
  {
    id: '3',
    number: 'Mesa 03',
    status: 'occupied',
    items: [
      {
        id: 'mock-i-1',
        productId: 'p-1',
        name: 'Burger Smash Clássico',
        priceCents: 2890,
        imageUrl: null,
        quantity: 1,
        selectedOptions: [{ groupId: 'size', groupName: 'Tamanho', valueId: 'size-regular', valueName: 'Regular', priceCents: 0 }],
        notes: 'Sem cebola',
      },
    ],
    customerName: 'Aline Souza',
  },
  { id: '4', number: 'Mesa 04', status: 'available', items: [] },
  {
    id: '5',
    number: 'Mesa 05',
    status: 'occupied',
    items: [
      {
        id: 'mock-i-2',
        productId: 'p-1',
        name: 'Burger Smash Clássico',
        priceCents: 2890,
        imageUrl: null,
        quantity: 2,
        selectedOptions: [{ groupId: 'size', groupName: 'Tamanho', valueId: 'size-large', valueName: 'Grande', priceCents: 800 }],
        notes: '',
      },
    ],
    customerName: 'Carlos Lima',
  },
  { id: '6', number: 'Mesa 06', status: 'reserved', items: [], customerName: 'Felipe Dias (19:30)' },
  { id: '7', number: 'Mesa 07', status: 'available', items: [] },
  { id: '8', number: 'Mesa 08', status: 'available', items: [] },
  {
    id: '9',
    number: 'Mesa 09',
    status: 'occupied',
    items: [
      {
        id: 'mock-i-3',
        productId: 'p-1',
        name: 'Burger Smash Clássico',
        priceCents: 2890,
        imageUrl: null,
        quantity: 1,
        selectedOptions: [{ groupId: 'size', groupName: 'Tamanho', valueId: 'size-regular', valueName: 'Regular', priceCents: 0 }],
        notes: '',
      },
    ],
    customerName: 'Mariana Costa',
  },
  { id: '10', number: 'Mesa 10', status: 'reserved', items: [], customerName: 'Juliana Rocha (21:00)' },
  { id: '11', number: 'Mesa 11', status: 'available', items: [] },
  { id: '12', number: 'Mesa 12', status: 'available', items: [] },
];

function areOptionsEqual(
  a: readonly OrderItemOption[],
  b: readonly OrderItemOption[],
): boolean {
  if (a.length !== b.length) return false;

  const sortedA = [...a].sort((x, y) => x.valueId.localeCompare(y.valueId));
  const sortedB = [...b].sort((x, y) => x.valueId.localeCompare(y.valueId));

  return sortedA.every(
    (opt, i) =>
      opt.groupId === sortedB[i].groupId &&
      opt.valueId === sortedB[i].valueId,
  );
}

export const usePosStore = create<PosStoreState>((set) => ({
  items: [],
  customer: null,
  activeDiscount: null,
  tables: INITIAL_TABLES,
  activeTableId: null,
  orders: PLACEHOLDER_ORDERS,
  customers: PLACEHOLDER_CUSTOMERS,

  addItem: (newItem) =>
    set((state) => {
      const existingItemIndex = state.items.findIndex(
        (item) =>
          item.productId === newItem.productId &&
          (item.notes || '') === (newItem.notes || '') &&
          areOptionsEqual(item.selectedOptions, newItem.selectedOptions),
      );

      if (existingItemIndex !== -1) {
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + newItem.quantity,
        };
        return { items: updatedItems };
      }

      const id = `${newItem.productId}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      return {
        items: [...state.items, { ...newItem, id }],
      };
    }),

  removeItem: (itemId) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== itemId),
    })),

  updateItemQuantity: (itemId, quantity) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId ? { ...item, quantity: Math.max(1, quantity) } : item,
      ),
    })),

  updateItem: (itemId, updatedFields) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId ? { ...item, ...updatedFields } : item,
      ),
    })),

  setCustomer: (customer) => set({ customer }),

  setDiscount: (discount) => set({ activeDiscount: discount }),

  setTable: (tableId) =>
    set((state) => {
      if (!tableId) {
        return { activeTableId: null, items: [] };
      }
      const matched = state.tables.find((t) => t.id === tableId);
      return {
        activeTableId: tableId,
        items: matched ? [...matched.items] : [],
      };
    }),

  saveTableOrder: () =>
    set((state) => {
      if (!state.activeTableId) return {};
      const updatedTables = state.tables.map((t) => {
        if (t.id === state.activeTableId) {
          return {
            ...t,
            status: state.items.length > 0 ? ('occupied' as const) : ('available' as const),
            items: [...state.items],
          };
        }
        return t;
      });
      return {
        tables: updatedTables,
        items: [],
        customer: null,
        activeDiscount: null,
        activeTableId: null,
      };
    }),

  releaseTable: (tableId) =>
    set((state) => {
      const updatedTables = state.tables.map((t) => {
        if (t.id === tableId) {
          return {
            ...t,
            status: 'available' as const,
            items: [],
            customerName: undefined,
          };
        }
        return t;
      });
      return { tables: updatedTables };
    }),

  registerOrder: (order) =>
    set((state) => ({
      orders: [...state.orders, order],
    })),

  // Comparação por referência: os pedidos mock têm IDs duplicados de propósito,
  // então filtrar por `id` apagaria várias linhas de uma vez.
  deleteOrder: (order) =>
    set((state) => ({
      orders: state.orders.filter((o) => o !== order),
    })),

  addCustomerRecord: (customer) =>
    set((state) => ({
      customers: [...state.customers, customer],
    })),

  updateCustomerRecord: (customerId, updatedFields) =>
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === customerId ? { ...c, ...updatedFields } : c,
      ),
    })),

  deleteCustomerRecord: (customerId) =>
    set((state) => ({
      customers: state.customers.filter((c) => c.id !== customerId),
    })),

  clearOrder: () =>
    set((state) => {
      const updatedTables = state.activeTableId
        ? state.tables.map((t) =>
            t.id === state.activeTableId
              ? { ...t, status: 'available' as const, items: [], customerName: undefined }
              : t,
          )
        : state.tables;
      return {
        items: [],
        customer: null,
        activeDiscount: null,
        activeTableId: null,
        tables: updatedTables,
      };
    }),
}));
