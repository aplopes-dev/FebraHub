import {
  resolveStockMovementReason,
  STOCK_MOVEMENT_REASONS,
} from './stock-movement-reason';

describe('resolveStockMovementReason', () => {
  it('deriva o motivo do par (origem, tipo)', () => {
    expect(resolveStockMovementReason('sale', 'saida')).toBe('sale');
    expect(resolveStockMovementReason('purchase', 'entrada')).toBe(
      'purchase_entry',
    );
    expect(resolveStockMovementReason('production', 'entrada')).toBe(
      'production_in',
    );
    expect(resolveStockMovementReason('production', 'saida')).toBe(
      'production_out',
    );
    expect(resolveStockMovementReason('transfer', 'entrada')).toBe(
      'transfer_in',
    );
    expect(resolveStockMovementReason('transfer', 'saida')).toBe(
      'transfer_out',
    );
    expect(resolveStockMovementReason('inventory', 'entrada')).toBe(
      'inventory_in',
    );
    expect(resolveStockMovementReason('inventory', 'saida')).toBe(
      'inventory_out',
    );
  });

  it('trata movimentação lançada à mão como motivo manual', () => {
    expect(resolveStockMovementReason('manual', 'entrada')).toBe('manual');
    expect(resolveStockMovementReason('manual', 'saida')).toBe('manual');
  });

  it('só produz motivos declarados no catálogo', () => {
    const sources = [
      'manual',
      'sale',
      'purchase',
      'production',
      'transfer',
      'inventory',
    ] as const;

    for (const source of sources) {
      for (const type of ['entrada', 'saida'] as const) {
        expect(STOCK_MOVEMENT_REASONS).toContain(
          resolveStockMovementReason(source, type),
        );
      }
    }
  });
});
