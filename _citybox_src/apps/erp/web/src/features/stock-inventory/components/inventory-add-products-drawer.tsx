"use client";

import { ProductPickerDrawer } from "@/components/ui/picker";
import type { Product } from "@/features/products/types/product";

type InventoryAddProductsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableProducts: Product[];
  onConfirm: (productIds: string[]) => void;
};

export function InventoryAddProductsDrawer({
  open,
  onOpenChange,
  availableProducts,
  onConfirm,
}: InventoryAddProductsDrawerProps) {
  return (
    <ProductPickerDrawer
      open={open}
      onOpenChange={onOpenChange}
      availableProducts={availableProducts}
      onConfirm={onConfirm}
      title="Adicionar produtos"
      description="Selecione os produtos que serão auditados nesta contagem."
      renderSecondaryMeta={(product) => product.sku}
    />
  );
}
