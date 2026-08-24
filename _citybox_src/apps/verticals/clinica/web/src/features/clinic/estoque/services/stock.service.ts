import type {
  StockMovement,
  StockMovementsResponse,
  StockMovementType,
  StockProduct,
  StockStats,
  StockStatus,
  Supplier,
} from "../types";
import { MOCK_STOCK_PRODUCTS, MOCK_STOCK_MEMBERS, MOCK_SUPPLIERS } from "../mock-data";

// ============================================================ //
// Store em memória — substitui a API do OdontoTech enquanto a  //
// feature de Estoque roda apenas com dados mockados no ERP.    //
// ============================================================ //

const MOCK_DELAY = 120;

// Usuário logado mockado — autoriza entradas/retiradas.
const CURRENT_USER = { id: "user-mock-1", name: "Dr. Leonardo Ramos" };

let idCounter = 9000;
function genId(prefix = "id"): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

function mockDelay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY));
}

function calcStatus(quantity: number, minQuantity: number): StockStatus {
  if (quantity <= 0) return "out_of_stock";
  if (quantity <= minQuantity) return "low_stock";
  return "in_stock";
}

function resolveMember(id?: string): { id: string; name: string } | null {
  if (!id) return null;
  const member = MOCK_STOCK_MEMBERS.find((p) => p.id === id);
  return member ? { id: member.id, name: member.name } : { id, name: "Profissional" };
}

// -------------------- Payloads (formato "API") -------------------- //

export interface CreateProductPayload {
  name: string;
  category: string;
  quantity: number;
  minQuantity: number;
  unitCost: number;
  sku?: string;
  supplierId?: string;
  photoUrl?: string;
  photoKey?: string;
}

export interface UpdateProductPayload {
  name?: string;
  category?: string;
  minQuantity?: number;
  unitCost?: number;
  sku?: string | null;
  supplierId?: string | null;
  photoUrl?: string | null;
  photoKey?: string | null;
}

export interface CreateSupplierPayload {
  name: string;
  phone?: string;
  email?: string;
}

export interface UpdateSupplierPayload {
  name?: string;
  phone?: string | null;
  email?: string | null;
}

export interface StockEntryPayload {
  productId: string;
  quantity: number;
  notes?: string;
}

export interface StockBulkEntryPayload {
  items: Array<{ productId: string; quantity: number }>;
}

export interface StockWithdrawalPayload {
  productId: string;
  quantity: number;
  requestedById?: string;
  requestedByName?: string;
  notes?: string;
}

export interface MovementsFilters {
  productId?: string;
  startDate?: string;
  endDate?: string;
  type?: StockMovementType;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// -------------------- Inicialização do store -------------------- //

interface Store {
  products: StockProduct[];
  suppliers: Supplier[];
  movements: StockMovement[];
}

function daysAgo(days: number, hour = 10): string {
  const d = new Date();
  d.setHours(hour, 30, 0, 0);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function buildInitialMovements(products: StockProduct[]): StockMovement[] {
  const list: StockMovement[] = [];
  products.forEach((product, index) => {
    // Uma retirada e uma entrada por produto — histórico inicial plausível.
    const requester = MOCK_STOCK_MEMBERS[index % MOCK_STOCK_MEMBERS.length];
    list.push({
      id: genId("mov"),
      type: "withdrawal",
      quantity: 5 + (index % 4) * 5,
      notes: null,
      createdAt: daysAgo(index + 1, 9),
      product: { id: product.id, name: product.name, photoUrl: product.photoUrl },
      requestedBy: { id: requester.id, name: requester.name },
      authorizedBy: CURRENT_USER,
    });
    list.push({
      id: genId("mov"),
      type: "entry",
      quantity: 20 + (index % 3) * 10,
      notes: null,
      createdAt: daysAgo(index + 8, 14),
      product: { id: product.id, name: product.name, photoUrl: product.photoUrl },
      requestedBy: null,
      authorizedBy: CURRENT_USER,
    });
  });
  return list.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

const store: Store = {
  products: MOCK_STOCK_PRODUCTS.map((p) => ({ ...p })),
  suppliers: MOCK_SUPPLIERS.map((s) => ({ ...s })),
  movements: buildInitialMovements(MOCK_STOCK_PRODUCTS),
};

function supplierRef(supplierId?: string | null): { id: string; name: string } | null {
  if (!supplierId) return null;
  const supplier = store.suppliers.find((s) => s.id === supplierId);
  return supplier ? { id: supplier.id, name: supplier.name } : null;
}

function pushMovement(
  product: StockProduct,
  type: StockMovementType,
  quantity: number,
  requestedById?: string,
  notes?: string,
): void {
  store.movements.unshift({
    id: genId("mov"),
    type,
    quantity,
    notes: notes ?? null,
    createdAt: new Date().toISOString(),
    product: { id: product.id, name: product.name, photoUrl: product.photoUrl },
    requestedBy: resolveMember(requestedById),
    authorizedBy: CURRENT_USER,
  });
}

// -------------------- stockService -------------------- //

const mockStockService = {
  suppliers: {
    list: (): Promise<{ suppliers: Supplier[] }> =>
      mockDelay({ suppliers: store.suppliers.map((s) => ({ ...s })) }),

    create: (data: CreateSupplierPayload): Promise<{ id: string; name: string }> => {
      const supplier: Supplier = {
        id: genId("supplier"),
        name: data.name,
        phone: data.phone ?? null,
        email: data.email ?? null,
        createdAt: new Date().toISOString(),
      };
      store.suppliers.push(supplier);
      return mockDelay({ id: supplier.id, name: supplier.name });
    },

    update: (id: string, data: UpdateSupplierPayload): Promise<void> => {
      const supplier = store.suppliers.find((s) => s.id === id);
      if (!supplier) return Promise.reject(new Error("Fornecedor não encontrado"));
      if (data.name !== undefined) supplier.name = data.name;
      if (data.phone !== undefined) supplier.phone = data.phone;
      if (data.email !== undefined) supplier.email = data.email;
      // Propaga o novo nome para os produtos vinculados.
      for (const product of store.products) {
        if (product.supplierId === id) {
          product.supplier = { id: supplier.id, name: supplier.name };
        }
      }
      return mockDelay(undefined);
    },

    delete: (id: string): Promise<void> => {
      store.suppliers = store.suppliers.filter((s) => s.id !== id);
      for (const product of store.products) {
        if (product.supplierId === id) {
          product.supplierId = null;
          product.supplier = null;
        }
      }
      return mockDelay(undefined);
    },
  },

  products: {
    list: (search?: string): Promise<{ products: StockProduct[] }> => {
      const term = search?.trim().toLowerCase();
      const products = store.products
        .filter((p) => {
          if (!term) return true;
          const haystack = [p.name, p.sku ?? "", p.category, p.supplier?.name ?? ""]
            .join(" ")
            .toLowerCase();
          return haystack.includes(term);
        })
        .map((p) => ({ ...p }));
      return mockDelay({ products });
    },

    create: (data: CreateProductPayload): Promise<{ id: string }> => {
      const quantity = data.quantity;
      const product: StockProduct = {
        id: genId("product"),
        name: data.name,
        photoUrl: data.photoUrl ?? null,
        category: data.category,
        sku: data.sku ?? null,
        supplierId: data.supplierId ?? null,
        supplier: supplierRef(data.supplierId),
        quantity,
        minQuantity: data.minQuantity,
        unitCost: data.unitCost,
        activeValue: quantity * data.unitCost,
        status: calcStatus(quantity, data.minQuantity),
      };
      store.products.push(product);
      if (quantity > 0) {
        pushMovement(product, "entry", quantity);
      }
      return mockDelay({ id: product.id });
    },

    update: (id: string, data: UpdateProductPayload): Promise<void> => {
      const product = store.products.find((p) => p.id === id);
      if (!product) return Promise.reject(new Error("Produto não encontrado"));

      if (data.name !== undefined) product.name = data.name;
      if (data.category !== undefined) product.category = data.category;
      if (data.minQuantity !== undefined) product.minQuantity = data.minQuantity;
      if (data.unitCost !== undefined) product.unitCost = data.unitCost;
      if (data.sku !== undefined) product.sku = data.sku;
      if (data.photoUrl !== undefined) product.photoUrl = data.photoUrl;
      if (data.supplierId !== undefined) {
        product.supplierId = data.supplierId;
        product.supplier = supplierRef(data.supplierId);
      }

      product.activeValue = product.quantity * product.unitCost;
      product.status = calcStatus(product.quantity, product.minQuantity);
      return mockDelay(undefined);
    },

    delete: (id: string): Promise<void> => {
      store.products = store.products.filter((p) => p.id !== id);
      store.movements = store.movements.filter((m) => m.product.id !== id);
      return mockDelay(undefined);
    },
  },

  stats: (): Promise<StockStats> => {
    const totalValue = store.products.reduce((sum, p) => sum + p.activeValue, 0);
    const stats: StockStats = {
      totalValue,
      totalProducts: store.products.length,
      inStock: store.products.filter((p) => p.status === "in_stock").length,
      lowStock: store.products.filter((p) => p.status === "low_stock").length,
      outOfStock: store.products.filter((p) => p.status === "out_of_stock").length,
    };
    return mockDelay(stats);
  },

  entries: {
    create: (data: StockEntryPayload): Promise<void> => {
      const product = store.products.find((p) => p.id === data.productId);
      if (!product) return Promise.reject(new Error("Produto não encontrado"));
      product.quantity += data.quantity;
      product.activeValue = product.quantity * product.unitCost;
      product.status = calcStatus(product.quantity, product.minQuantity);
      pushMovement(product, "entry", data.quantity, undefined, data.notes);
      return mockDelay(undefined);
    },

    createBulk: (data: StockBulkEntryPayload): Promise<void> => {
      for (const item of data.items) {
        const product = store.products.find((p) => p.id === item.productId);
        if (!product) continue;
        product.quantity += item.quantity;
        product.activeValue = product.quantity * product.unitCost;
        product.status = calcStatus(product.quantity, product.minQuantity);
        pushMovement(product, "entry", item.quantity);
      }
      return mockDelay(undefined);
    },
  },

  withdrawals: {
    create: (data: StockWithdrawalPayload): Promise<void> => {
      const product = store.products.find((p) => p.id === data.productId);
      if (!product) return Promise.reject(new Error("Produto não encontrado"));
      if (data.quantity > product.quantity) {
        return Promise.reject(new Error("Quantidade maior que o estoque disponível"));
      }
      product.quantity = Math.max(0, product.quantity - data.quantity);
      product.activeValue = product.quantity * product.unitCost;
      product.status = calcStatus(product.quantity, product.minQuantity);
      pushMovement(product, "withdrawal", data.quantity, data.requestedById, data.notes);
      return mockDelay(undefined);
    },
  },

  movements: {
    list: (filters?: MovementsFilters): Promise<StockMovementsResponse> => {
      const page = filters?.page ?? 1;
      const limit = filters?.limit ?? 20;
      const start = filters?.startDate ? new Date(filters.startDate).getTime() : undefined;
      const end = filters?.endDate ? new Date(filters.endDate).getTime() : undefined;

      const filtered = store.movements.filter((m) => {
        if (filters?.type && m.type !== filters.type) return false;
        if (filters?.productId && m.product.id !== filters.productId) return false;
        const time = new Date(m.createdAt).getTime();
        if (start !== undefined && time < start) return false;
        if (end !== undefined && time > end) return false;
        return true;
      });

      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const pageStart = (page - 1) * limit;
      const movements = filtered
        .slice(pageStart, pageStart + limit)
        .map((m) => ({ ...m }));

      return mockDelay({ movements, pagination: { page, limit, total, totalPages } });
    },
  },
};

export { stockService } from "./stock.api.service";
