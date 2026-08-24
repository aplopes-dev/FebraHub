import type { FloorFixture, FloorTable } from '../types/floor-table';

/**
 * Layout mock inspirado na referência visual (círculos topo/base,
 * quadrados no centro, retângulos à direita). Coordenadas em % do canvas.
 */
export const PLACEHOLDER_FLOOR_TABLES: readonly FloorTable[] = [
  // Linha superior — círculos (cap. 2)
  { id: 't1', name: 'Mesa 1', capacity: 2, status: 'available', shape: 'circle', x: 18, y: 10, w: 7, h: 10 },
  { id: 't2', name: 'Mesa 2', capacity: 2, status: 'available', shape: 'circle', x: 28, y: 10, w: 7, h: 10 },
  {
    id: 't3',
    name: 'Mesa 3',
    capacity: 2,
    status: 'occupied',
    shape: 'circle',
    x: 38,
    y: 10,
    w: 7,
    h: 10,
    orderId: '0293E10',
    customerName: 'Emily Brown',
    totalCents: 12000,
  },
  { id: 't4', name: 'Mesa 4', capacity: 2, status: 'available', shape: 'circle', x: 48, y: 10, w: 7, h: 10 },
  { id: 't5', name: 'Mesa 5', capacity: 2, status: 'available', shape: 'circle', x: 58, y: 10, w: 7, h: 10 },
  { id: 't6', name: 'Mesa 6', capacity: 2, status: 'available', shape: 'circle', x: 68, y: 10, w: 7, h: 10 },
  { id: 't7', name: 'Mesa 7', capacity: 2, status: 'available', shape: 'circle', x: 78, y: 10, w: 7, h: 10 },
  { id: 't8', name: 'Mesa 8', capacity: 2, status: 'available', shape: 'circle', x: 88, y: 10, w: 7, h: 10 },

  // Centro — quadrados (cap. 4)
  { id: 't9', name: 'Mesa 9', capacity: 4, status: 'available', shape: 'square', x: 22, y: 38, w: 8, h: 12 },
  {
    id: 't10',
    name: 'Mesa 10',
    capacity: 4,
    status: 'occupied',
    shape: 'square',
    x: 34,
    y: 38,
    w: 8,
    h: 12,
    orderId: '02A1B44',
    customerName: 'João Silva',
    totalCents: 8750,
  },
  { id: 't11', name: 'Mesa 11', capacity: 4, status: 'available', shape: 'square', x: 46, y: 38, w: 8, h: 12 },
  { id: 't12', name: 'Mesa 12', capacity: 4, status: 'available', shape: 'square', x: 58, y: 38, w: 8, h: 12 },

  // Direita — retângulos (cap. 6)
  { id: 't13', name: 'Mesa 13', capacity: 6, status: 'available', shape: 'rect', x: 74, y: 32, w: 14, h: 10 },
  {
    id: 't14',
    name: 'Mesa 14',
    capacity: 6,
    status: 'occupied',
    shape: 'rect',
    x: 74,
    y: 46,
    w: 14,
    h: 10,
    orderId: '02C8F01',
    customerName: 'Maria Costa',
    totalCents: 24300,
  },
  { id: 't15', name: 'Mesa 15', capacity: 6, status: 'available', shape: 'rect', x: 74, y: 60, w: 14, h: 10 },

  // Linha inferior — círculos (cap. 2)
  { id: 't16', name: 'Mesa 16', capacity: 2, status: 'available', shape: 'circle', x: 18, y: 78, w: 7, h: 10 },
  { id: 't17', name: 'Mesa 17', capacity: 2, status: 'available', shape: 'circle', x: 28, y: 78, w: 7, h: 10 },
  { id: 't18', name: 'Mesa 18', capacity: 2, status: 'available', shape: 'circle', x: 38, y: 78, w: 7, h: 10 },
  { id: 't19', name: 'Mesa 19', capacity: 2, status: 'available', shape: 'circle', x: 48, y: 78, w: 7, h: 10 },
  { id: 't20', name: 'Mesa 20', capacity: 2, status: 'available', shape: 'circle', x: 58, y: 78, w: 7, h: 10 },
] as const;

export const PLACEHOLDER_FLOOR_FIXTURES: readonly FloorFixture[] = [
  { id: 'cashier', label: 'Caixa', x: 4, y: 32, w: 8, h: 28 },
] as const;
