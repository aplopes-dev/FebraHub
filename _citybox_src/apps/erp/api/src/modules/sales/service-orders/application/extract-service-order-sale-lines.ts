/**
 * União de duas formas (spec erp/031 D1): linha de produto de catálogo, ou
 * linha de serviço sem vínculo de catálogo (`productId: null` + `description`
 * como rótulo). Ver contracts/generate-sale.contract.md.
 */
export type ServiceOrderLinePayload =
  | {
      productId: string;
      description?: undefined;
      quantity: string;
      unitPriceCents: number;
    }
  | {
      productId: null;
      description: string;
      quantity: string;
      unitPriceCents: number;
    };

/** Converte `quantity` para string sem arriscar `[object Object]` — só
 *  `string`/`number` viram texto de verdade; qualquer outro tipo cai no
 *  default `'1'`. */
function stringifyQuantity(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  return '1';
}

/**
 * Extrai as linhas válidas de `payloadJson.lines` para gerar a venda de uma
 * OS — pura, sem I/O, testável sem banco. Aceita linhas de produto
 * (`productId: string`) e de serviço (`productId: null` + `description` não
 * vazia); descarta o resto silenciosamente (formato inesperado).
 */
export function extractServiceOrderSaleLines(
  payloadJson: unknown,
): ServiceOrderLinePayload[] {
  if (!payloadJson || typeof payloadJson !== 'object') return [];
  const rawLines = (payloadJson as Record<string, unknown>).lines;
  if (!Array.isArray(rawLines)) return [];
  // `Array.isArray` estreita para `any[]` mesmo a partir de `unknown` — reatribuir
  // à variável tipada evita `no-unsafe-member-access` nos filtros abaixo.
  const raw: unknown[] = rawLines;

  return raw
    .filter(
      (line): line is Record<string, unknown> =>
        !!line && typeof line === 'object',
    )
    .filter(
      (line) =>
        Number(line.unitPriceCents) >= 0 &&
        (typeof line.productId === 'string' ||
          (line.productId == null &&
            typeof line.description === 'string' &&
            line.description.trim().length > 0)),
    )
    .map(
      (line): ServiceOrderLinePayload =>
        typeof line.productId === 'string'
          ? {
              productId: line.productId,
              quantity: stringifyQuantity(line.quantity),
              unitPriceCents: Number(line.unitPriceCents),
            }
          : {
              productId: null,
              description: String(line.description).trim(),
              quantity: stringifyQuantity(line.quantity),
              unitPriceCents: Number(line.unitPriceCents),
            },
    );
}
