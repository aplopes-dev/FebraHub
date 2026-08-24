export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";
export type StockMovementType = "entry" | "withdrawal" | "adjustment";

export interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  createdAt: string;
}

export interface StockProduct {
  id: string;
  name: string;
  photoUrl: string | null;
  category: string;
  sku: string | null;
  supplierId: string | null;
  supplier: { id: string; name: string } | null;
  quantity: number;
  minQuantity: number;
  unitCost: number;
  activeValue: number;
  status: StockStatus;
}

export interface StockMovement {
  id: string;
  type: StockMovementType;
  quantity: number;
  notes: string | null;
  createdAt: string;
  product: { id: string; name: string; photoUrl: string | null };
  requestedBy: { id: string; name: string } | null;
  authorizedBy: { id: string; name: string };
}

export interface StockMovementsResponse {
  movements: StockMovement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface StockStats {
  totalValue: number;
  totalProducts: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

export const STATUS_LABELS: Record<StockStatus, string> = {
  in_stock: "Em estoque",
  low_stock: "Estoque baixo",
  out_of_stock: "Sem estoque",
};

export const STATUS_COLORS: Record<StockStatus, string> = {
  in_stock: "bg-teal-100 text-teal-700 border-teal-200",
  low_stock: "bg-yellow-100 text-yellow-700 border-yellow-200",
  out_of_stock: "bg-rose-100 text-rose-700 border-rose-200",
};
