/**
 * Opções de "por página" em múltiplos de 8, crescendo conforme o total.
 * Sempre inclui um valor que cobre todos os itens (arredondado para cima).
 */
export function buildPerPageOptions(total: number): number[] {
  const step = 8;
  const safeTotal = Math.max(0, Math.floor(total));
  if (safeTotal <= 0) return [step];

  const cover = Math.ceil(safeTotal / step) * step;
  const ladder = [8, 16, 24, 32, 48, 64, 96, 128, 192, 256, 384, 512];
  const options = ladder.filter((size) => size < cover);
  options.push(cover);
  return options;
}

export const DEFAULT_PER_PAGE = 8;
