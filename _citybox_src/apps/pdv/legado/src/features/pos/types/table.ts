import type { OrderItem } from './order';

export type TableStatus = 'available' | 'occupied' | 'reserved';

export type PosTable = {
  id: string;
  number: string;
  status: TableStatus;
  items: OrderItem[];
  customerName?: string;
};
