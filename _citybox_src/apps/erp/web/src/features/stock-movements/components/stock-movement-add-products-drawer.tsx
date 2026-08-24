"use client";

import { ProductPickerDrawer } from "@/components/ui/picker/product-picker-drawer";
import type { Product } from "@/features/products/types/product";

type StockMovementAddProductsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableProducts: Product[];
  onConfirm: (productIds: string[]) => void;
};

/**
 * Wrapper da feature sobre o picker compartilhado de produtos.
 * Mantido para compatibilidade com painéis de compras, pedidos e contratos.
 */
export function StockMovementAddProductsDrawer({
  open,
  onOpenChange,
  availableProducts,
  onConfirm,
}: StockMovementAddProductsDrawerProps) {
  return (
    <ProductPickerDrawer
      open={open}
      onOpenChange={onOpenChange}
      availableProducts={availableProducts}
      onConfirm={onConfirm}
      title="Adicionar produtos"
      description="Selecione os produtos que farão parte desta movimentação."
    />
  );
}
