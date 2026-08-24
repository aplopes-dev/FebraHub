/**
 * Tipos e helpers do vínculo produto↔fornecedor no formulário.
 * A lista de opções vem de `useActiveSuppliersQuery` (API).
 */

export type ProductSupplierRow = {
  id: string;
  supplierId: string;
  supplierName: string;
  code: string;
  conversion: string;
};

export function createEmptySupplierRow(): ProductSupplierRow {
  return {
    id: crypto.randomUUID(),
    supplierId: "",
    supplierName: "",
    code: "",
    conversion: "",
  };
}

export function areSupplierRowsEqual(
  a: ProductSupplierRow[],
  b: ProductSupplierRow[],
): boolean {
  if (a.length !== b.length) return false;
  return a.every((row, index) => {
    const other = b[index];
    return (
      other != null &&
      row.supplierId === other.supplierId &&
      row.supplierName === other.supplierName &&
      row.code === other.code &&
      row.conversion === other.conversion
    );
  });
}
