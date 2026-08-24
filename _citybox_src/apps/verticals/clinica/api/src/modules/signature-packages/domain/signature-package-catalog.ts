export type SignaturePackageCatalogEntry = {
  id: string;
  quantity: number;
  priceCents: number;
};

/** Catálogo fixo de pacotes de créditos de assinatura eletrônica. */
export const SIGNATURE_PACKAGE_CATALOG: readonly SignaturePackageCatalogEntry[] =
  [
    { id: 'pkg-250', quantity: 250, priceCents: 9990 },
    { id: 'pkg-600', quantity: 600, priceCents: 19990 },
    { id: 'pkg-1000', quantity: 1000, priceCents: 29990 },
  ] as const;

/** Saldo inicial até o admin liberar o primeiro pacote. */
export const SIGNATURE_CREDIT_SEED_BALANCE = 0;

export function findSignaturePackageById(
  packageId: string,
): SignaturePackageCatalogEntry | undefined {
  return SIGNATURE_PACKAGE_CATALOG.find((pkg) => pkg.id === packageId);
}
