/**
 * Gera e baixa um CSV (abre no Excel) com os códigos de um cupom.
 *
 * Mock UI: sem backend. Quando `autoNumbering` está ativo, adiciona um número
 * sequencial ao final do nome-base (MEUCUPOM1, MEUCUPOM2…); caso contrário,
 * repete o mesmo código.
 */
export function downloadCouponCodes(options: {
  baseName: string;
  quantity: number;
  autoNumbering: boolean;
}): void {
  const { baseName, quantity, autoNumbering } = options;
  const safeName = baseName.trim() || "CUPOM";
  const total = Math.max(1, Math.floor(quantity));

  const codes = Array.from({ length: total }, (_, index) =>
    autoNumbering ? `${safeName}${index + 1}` : safeName,
  );

  const header = "codigo";
  const body = codes.map((code) => escapeCsvCell(code)).join("\r\n");
  const csv = `${header}\r\n${body}\r\n`;

  const blob = new Blob([`﻿${csv}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeName}-cupons.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
