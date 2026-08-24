import { calculateStockStatus } from '../domain/utils/stock-status.utils';

describe('StockStatus utils', () => {
  it('returns out_of_stock when quantity <= 0', () => {
    expect(calculateStockStatus(0, 5)).toBe('out_of_stock');
    expect(calculateStockStatus(-1, 5)).toBe('out_of_stock');
  });

  it('returns low_stock when quantity <= minQuantity', () => {
    expect(calculateStockStatus(5, 5)).toBe('low_stock');
    expect(calculateStockStatus(4, 5)).toBe('low_stock');
  });

  it('returns in_stock when quantity > minQuantity', () => {
    expect(calculateStockStatus(6, 5)).toBe('in_stock');
    expect(calculateStockStatus(10, 1)).toBe('in_stock');
  });
});
