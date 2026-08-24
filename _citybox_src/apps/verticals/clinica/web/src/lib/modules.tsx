'use client';

export type VerticalModule = {
  id: string;
  label: string;
  permission: string;
};

/** App dedicado à vertical Clínica — rotas servidas na raiz (`/`). */
export const CLINIC_MODULE: VerticalModule = {
  id: 'clinic',
  label: 'Clínica',
  permission: 'vertical_access',
};

export const MODULE_REGISTRY: VerticalModule[] = [CLINIC_MODULE];

export function getModule(id: string) {
  return MODULE_REGISTRY.find((m) => m.id === id);
}
