import type { PropertyStatus } from '@/features/shared/types';
import { PROPERTY_STATUS_LABEL } from '@/features/shared/types';

/** Imóvel elegível para vínculo novo em lead ou busca geral na transação. */
export function isPropertyAvailableForSelection(
  property: {
    status: PropertyStatus;
    units?: number;
    occupiedUnits?: number;
  } | null | undefined,
): boolean {
  if (!property) return false;
  if (property.status === 'sold-out') return false;
  if (property.status === 'available') return hasFreeUnit(property);
  // reserved/occupied só se ainda houver unidade livre (multiunidade).
  return hasFreeUnit(property);
}

/**
 * Imóvel já linkado ao lead: pode promover em `reserved` ou `occupied`
 * (indisponível para outros, mas ainda do negócio deste lead).
 */
export function isPropertyPromotableForLinkedLead(
  property: { status: PropertyStatus } | null | undefined,
): boolean {
  if (!property) return false;
  return (
    property.status === 'available' ||
    property.status === 'reserved' ||
    property.status === 'occupied'
  );
}

function unitsTotal(property: { units?: number }): number {
  return Math.max(1, property.units ?? 1);
}

function occupiedCount(property: {
  status: PropertyStatus;
  units?: number;
  occupiedUnits?: number;
}): number {
  if (property.occupiedUnits != null) {
    return Math.max(0, property.occupiedUnits);
  }
  if (property.status === 'available') return 0;
  return unitsTotal(property);
}

export function hasFreeUnit(property: {
  status: PropertyStatus;
  units?: number;
  occupiedUnits?: number;
}): boolean {
  return occupiedCount(property) < unitsTotal(property);
}

/** Overlay / esmaecer só quando não resta unidade livre. */
export function isPropertyFullyUnavailable(property: {
  status: PropertyStatus;
  units?: number;
  occupiedUnits?: number;
}): boolean {
  if (property.status === 'sold-out') return true;
  return !hasFreeUnit(property);
}

/** Texto do overlay no card (não genérico “Indisponível” para Em espera). */
export function propertyUnavailableOverlayLabel(property: {
  status: PropertyStatus;
}): string {
  if (property.status === 'reserved') return PROPERTY_STATUS_LABEL.reserved;
  if (property.status === 'occupied') return PROPERTY_STATUS_LABEL.occupied;
  if (property.status === 'sold-out') return PROPERTY_STATUS_LABEL['sold-out'];
  return 'Indisponível';
}
