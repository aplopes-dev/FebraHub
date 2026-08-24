export type FloorTableShape = 'circle' | 'square' | 'rect';

export type FloorTableStatus = 'available' | 'occupied';

export type FloorTableCapacity = 2 | 4 | 6;

/** Rotação no canvas em graus (sentido horário). */
export type FloorTableRotation = 0 | 90 | 180 | 270;

export type FloorTable = {
  id: string;
  name: string;
  capacity: FloorTableCapacity;
  status: FloorTableStatus;
  shape: FloorTableShape;
  /** Posição horizontal em % do canvas (0–100). */
  x: number;
  /** Posição vertical em % do canvas (0–100). */
  y: number;
  /** Largura em % do canvas (dimensão natural, antes da rotação). */
  w: number;
  /** Altura em % do canvas (dimensão natural, antes da rotação). */
  h: number;
  /** Rotação visual em graus. Padrão 0. */
  rotationDeg?: FloorTableRotation;
  orderId?: string;
  customerName?: string;
  totalCents?: number;
};

export type FloorFixture = {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Rotação visual em graus. Padrão 0. */
  rotationDeg?: FloorTableRotation;
};

export function nextRotationDeg(
  current: FloorTableRotation | undefined,
): FloorTableRotation {
  const value = ((current ?? 0) + 90) % 360;
  return value as FloorTableRotation;
}
