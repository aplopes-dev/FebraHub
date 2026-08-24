/** Tipos usados por mais de uma feature. Tipos locais ficam na própria feature. */

/** Variação percentual exibida ao lado de uma métrica. */
export type Trend = {
  /** Positivo sobe, negativo desce, zero neutro. */
  value: number;
  /** `up` = bom (verde), `down` = ruim (vermelho). Independe do sinal. */
  direction: 'up' | 'down';
};

export type Person = {
  id: string;
  name: string;
  /** Usado no fallback do avatar quando não há foto. */
  initials: string;
  city?: string;
  state?: string;
};

export type Lead = Person & {
  email?: string;
  phone?: string;
};

export type PropertyType = 'house' | 'apartment' | 'villa' | 'land' | 'commercial';

export type PropertyStatus = 'available' | 'occupied' | 'sold-out' | 'reserved';

export type Property = {
  id: string;
  name: string;
  city: string;
  state: string;
  type: PropertyType;
  units: number;
  cost: number;
  views: number;
  status: PropertyStatus;
  /** Ocupação em `x/y` — só para status `occupied`. */
  occupiedUnits?: number;
  activeLeads: Person[];
  totalActiveLeads: number;
};

export const PROPERTY_TYPE_LABEL: Record<PropertyType, string> = {
  house: 'Casa',
  apartment: 'Apartamento',
  villa: 'Villa',
  land: 'Terreno',
  commercial: 'Comercial',
};

export const PROPERTY_STATUS_LABEL: Record<PropertyStatus, string> = {
  available: 'Disponível',
  occupied: 'Ocupado',
  'sold-out': 'Esgotado',
  reserved: 'Em espera',
};
