export type AssinaturaPackage = {
  id: string;
  quantity: number;
  priceReais: number;
};

/** Catálogo local de pacotes (ids alinhados à clinica-api). */
export const ASSINATURA_PACKAGES: readonly AssinaturaPackage[] = [
  { id: 'pkg-250', quantity: 250, priceReais: 99.9 },
  { id: 'pkg-600', quantity: 600, priceReais: 199.9 },
  { id: 'pkg-1000', quantity: 1000, priceReais: 299.9 },
] as const;
