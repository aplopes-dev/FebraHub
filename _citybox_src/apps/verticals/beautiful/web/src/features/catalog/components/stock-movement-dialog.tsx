'use client';

import { StockWithdrawalDrawer } from './stock-withdrawal-drawer';
import type { ProductItem } from '../types/catalog.types';

export type StockMovementDialogProps = {
  open: boolean;
  product: ProductItem | null;
  products?: ProductItem[];
  onClose: () => void;
};

/**
 * Wrapper de compatibilidade que abre o Drawer de Retirada de Estoque.
 */
export function StockMovementDialog({
  open,
  product,
  products = [],
  onClose,
}: StockMovementDialogProps) {
  return (
    <StockWithdrawalDrawer
      open={open}
      product={product}
      products={products}
      onClose={onClose}
    />
  );
}

export { StockWithdrawalDrawer };
