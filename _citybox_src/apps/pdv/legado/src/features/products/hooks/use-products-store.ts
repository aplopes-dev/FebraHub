import { create } from 'zustand';
import { PLACEHOLDER_PRODUCTS } from '../data/placeholder-products';
import type { PdvProduct } from '../types/product';

type ProductsState = {
  products: PdvProduct[];
  setProducts: (products: readonly PdvProduct[]) => void;
  addProduct: (product: PdvProduct) => void;
  updateProduct: (id: string, updated: PdvProduct) => void;
  deleteProduct: (productId: string) => void;
  skuExists: (sku: string, excludeId?: string) => boolean;
};

function normalizeSkuKey(sku: string): string {
  return sku.trim().toLowerCase();
}

export const useProductsStore = create<ProductsState>((set, get) => ({
  products: PLACEHOLDER_PRODUCTS.map((product) => ({ ...product })),

  setProducts: (products) => set({ products: products.map((product) => ({ ...product })) }),

  addProduct: (product) =>
    set((state) => ({
      products: [{ ...product }, ...state.products],
    })),

  updateProduct: (id, updated) =>
    set((state) => ({
      products: state.products.map((product) => (product.id === id ? { ...updated } : product)),
    })),

  deleteProduct: (productId) =>
    set((state) => ({
      products: state.products.filter((product) => product.id !== productId),
    })),

  skuExists: (sku, excludeId) => {
    const key = normalizeSkuKey(sku);
    if (!key) return false;
    return get().products.some((product) => {
      if (excludeId && normalizeSkuKey(product.id) === normalizeSkuKey(excludeId)) {
        return false;
      }
      return normalizeSkuKey(product.id) === key;
    });
  },
}));
